/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useMemo, useRef, useEffect, ChangeEvent } from 'react';
import { motion, AnimatePresence, useScroll, useSpring } from 'motion/react';
import { 
  Calendar, 
  Download,
  Menu,
  Loader2,
  Upload,
  X,
  User as UserIcon,
  Mail,
  Settings,
  BookOpen,
  Layout,
  ArrowRight,
  ShieldCheck,
  Cpu,
  Users
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { onAuthStateChanged, signOut, User, updateProfile, sendPasswordResetEmail } from 'firebase/auth';
import { Area } from 'react-easy-crop';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

import { auth, db } from './lib/firebase';
import { doc, setDoc, serverTimestamp, getDoc } from 'firebase/firestore';
import { INTAKE_OPTIONS, MODULE_MAPPING, COURSE_BASE_DATE } from './constants';
import { TimetableRow } from './types';
import { parseDateString, resizeImage, getCroppedImg } from './lib/utils';
import { COURSES, getWeekDates } from './data/courses';

// Components
import LoginPage from './components/LoginPage';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import AdminPanel from './components/AdminPanel';
import SettingsPanel from './components/SettingsPanel';
import DetailModal from './components/DetailModal';
import CropModal from './components/CropModal';

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'moodle' | 'outlook' | 'admin' | 'settings' | 'lms'>('dashboard');
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const ROWS_PER_PAGE = 10;

  const [selectedIntake, setSelectedIntake] = useState(INTAKE_OPTIONS[2]);
  const [isLightMode, _setIsLightMode] = useState(true);
  const [isCapturing, setIsCapturing] = useState(false);
  const [searchQuery, _setSearchQuery] = useState('');
  const [uploadedData, setUploadedData] = useState<Record<string, { name: string, rows: TimetableRow[] }[]> | null>(null);
  const [showMasterLedger, setShowMasterLedger] = useState(true);
  const [studentRegistry, setStudentRegistry] = useState<{name: string, email: string, password: string, qualification: string, intakeDate: string}[] | null>(null);
  const [selectedUploadedIntake, setSelectedUploadedIntake] = useState<number>(0);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const studentRegistryInputRef = useRef<HTMLInputElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);

  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editStudentId, _setEditStudentId] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [userData, setUserData] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [weekDetailsMap, setWeekDetailsMap] = useState<Record<string, { time: string, trainers: string }>>({});

  // Cropping States
  const [imageToCrop, setImageToCrop] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [isCropModalOpen, setIsCropModalOpen] = useState(false);

  // Timetable State
  const [selectedWeek, setSelectedWeek] = useState<TimetableRow | null>(null);
  const [selectedDayDetail, setSelectedDayDetail] = useState<{day: number, month: number, year: number} | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  useEffect(() => {
    const fetchGlobalData = async () => {
      try {
        const registryRef = doc(db, 'system', 'studentRegistry');
        const registrySnap = await getDoc(registryRef);
        if (registrySnap.exists()) {
          setStudentRegistry(registrySnap.data().data);
        }

        const uploadedRef = doc(db, 'system', 'uploadedTimetable');
        const uploadedSnap = await getDoc(uploadedRef);
        if (uploadedSnap.exists()) {
          setUploadedData(uploadedSnap.data().data);
        }
      } catch (err) {
        console.error("Error fetching global system data:", err);
      }
    };
    fetchGlobalData();
  }, []);

  useEffect(() => {
    const fetchUserData = async () => {
      if (user) {
        const ADMIN_EMAIL = 'dg2723777@gmail.com';
        const isHardcodedAdmin = user.email === ADMIN_EMAIL;
        
        const adminDocRef = doc(db, 'admins', user.uid);
        const adminDocSnap = await getDoc(adminDocRef);
        
        setIsAdmin(isHardcodedAdmin || adminDocSnap.exists());

        const docRef = doc(db, 'users', user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setUserData(docSnap.data());
          setEditName(user.displayName || docSnap.data().displayName || '');
          setEditPhone(docSnap.data().phone || '');
          _setEditStudentId(docSnap.data().studentId || '');
          
          if (docSnap.data().weekDetails) {
            setWeekDetailsMap(docSnap.data().weekDetails);
          }
        }
      }
    };
    fetchUserData();
  }, [user]);

  const handlePhotoUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    const reader = new FileReader();
    reader.onload = () => {
      setImageToCrop(reader.result as string);
      setIsCropModalOpen(true);
      e.target.value = "";
    };
    reader.readAsDataURL(file);
  };

  const onCropComplete = (_processedArea: Area, pixelArea: Area) => {
    setCroppedAreaPixels(pixelArea);
  };

  const handleApplyCrop = async () => {
    if (!imageToCrop || !croppedAreaPixels || !user) return;

    setIsUpdating(true);
    setIsCropModalOpen(false);
    
    try {
      const croppedImage = await getCroppedImg(imageToCrop, croppedAreaPixels);
      const authThumb = await resizeImage(croppedImage, 48, 48);
      const finalAuthUrl = authThumb.length <= 2048 ? authThumb : '';
      const firestoreImage = await resizeImage(croppedImage, 400, 400);
      
      try {
        await updateProfile(user, { photoURL: finalAuthUrl });
      } catch (authErr) {
        console.warn("Could not update Auth photoURL (size limit), skipping Auth update but continuing with Firestore:", authErr);
      }
      
      const userRef = doc(db, 'users', user.uid);
      await setDoc(userRef, { 
        photoURL: firestoreImage,
        updatedAt: serverTimestamp() 
      }, { merge: true });
      
      setUser({...user, photoURL: finalAuthUrl} as User);
      setUserData(prev => ({...prev, photoURL: firestoreImage}));
      setImageToCrop(null);
    } catch (error) {
      console.error("Error cropping/uploading photo:", error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleUpdateProfile = async () => {
    if (!user) return;
    setIsUpdating(true);
    try {
      await updateProfile(user, { displayName: editName });
      
      const userRef = doc(db, 'users', user.uid);
      await setDoc(userRef, {
        displayName: editName,
        phone: editPhone,
        updatedAt: serverTimestamp()
      }, { merge: true });
      
      setUser({...user, displayName: editName} as User);
      setUserData(prev => ({...prev, displayName: editName, phone: editPhone }));
      setIsEditingProfile(false);
    } catch (error) {
      console.error("Error updating profile:", error);
    } finally {
      setIsUpdating(false);
    }
  };

  const { scrollY, scrollYProgress } = useScroll();
  const _scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });
  const [_showScrollTop, setShowScrollTop] = useState(false);
  
  useEffect(() => {
    if (!user) {
      document.body.classList.add('no-scrollbar');
    } else {
      document.body.classList.remove('no-scrollbar');
    }
  }, [user]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
      
      if (currentUser) {
        try {
          const userRef = doc(db, 'users', currentUser.uid);
          await setDoc(userRef, {
            uid: currentUser.uid,
            email: currentUser.email,
            displayName: currentUser.displayName,
            updatedAt: serverTimestamp(),
          }, { merge: true });
        } catch (error) {
          console.error("Error syncing user:", error);
        }
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    return scrollY.on("change", (latest) => {
      setShowScrollTop(latest > 500);
    });
  }, [scrollY]);

  const timetable = useMemo(() => {
    let baseRows: TimetableRow[] = [];

    if (uploadedData && selectedCourseId && uploadedData[selectedCourseId] && uploadedData[selectedCourseId][selectedUploadedIntake]) {
      baseRows = uploadedData[selectedCourseId][selectedUploadedIntake].rows;
    } else {
      const today = new Date();
      const rows: TimetableRow[] = [];
      for (let i = 0; i < 52; i++) {
        const start = new Date(selectedIntake.date);
        start.setDate(start.getDate() + (i * 7));
        const end = new Date(start);
        end.setDate(end.getDate() + 6);

        const dates = getWeekDates(selectedIntake.date, i);
        const isCurrent = today >= start && today <= end;

        const absoluteStart = new Date(COURSE_BASE_DATE);
        const diffDays = Math.floor((start.getTime() - absoluteStart.getTime()) / (1000 * 60 * 60 * 24));
        const absoluteWeek = Math.floor(diffDays / 7) + 1;
        const code = MODULE_MAPPING[absoluteWeek] || 'TBA';
        const isBreak = code.toLowerCase().includes('break');

        rows.push({
          week: i + 1,
          startDate: dates.start,
          endDate: dates.end,
          intakeCode: code,
          mode: isBreak ? 'Paused' : (absoluteWeek < 30 ? 'Face to Face Live Stream' : 'Face to Face Kitchen'),
          isCurrent,
          isBreak
        });
      }
      baseRows = rows;
    }
    
    if (!searchQuery.trim() && Object.keys(weekDetailsMap).length === 0) return baseRows;
    
    const intakeKey = uploadedData ? `uploaded_${selectedUploadedIntake}` : selectedIntake.id;
    const enrichedRows = baseRows.map(row => {
      const weekKey = `${selectedCourseId}_${intakeKey}_w${row.week}`;
      const custom = weekDetailsMap[weekKey];
      return custom ? { ...row, ...custom } : row;
    });

    if (!searchQuery.trim()) return enrichedRows;
    
    return enrichedRows.filter(row => 
      row.intakeCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      row.week.toString().includes(searchQuery) ||
      row.startDate.toLowerCase().includes(searchQuery.toLowerCase()) ||
      row.endDate.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [selectedIntake, searchQuery, uploadedData, selectedUploadedIntake, weekDetailsMap, selectedCourseId]);

  const filteredCourses = useMemo(() => {
    const registeredUser = studentRegistry?.find(s => s.email.toLowerCase() === user?.email?.toLowerCase());
    if (registeredUser) {
      const q = registeredUser.qualification.toLowerCase();
      return COURSES.filter(c => 
        q.includes(c.id.toLowerCase()) || 
        c.name.toLowerCase().includes(q) ||
        q.includes(c.name.toLowerCase())
      );
    }
    return COURSES;
  }, [user, studentRegistry]);

  useEffect(() => {
    if (user && studentRegistry) {
      const reg = studentRegistry.find(s => s.email.toLowerCase() === user.email?.toLowerCase());
      if (reg && reg.intakeDate) {
        const matchingIntake = INTAKE_OPTIONS.find(i => 
          i.date.toLowerCase() === reg.intakeDate.toLowerCase() ||
          i.date.toLowerCase().includes(reg.intakeDate.toLowerCase()) ||
          reg.intakeDate.toLowerCase().includes(i.date.toLowerCase())
        );
        if (matchingIntake) {
          setSelectedIntake(matchingIntake);
        } else {
          const customId = `reg-${reg.email}`;
          if (selectedIntake.id !== customId) {
            setSelectedIntake({ id: customId, date: reg.intakeDate });
          }
        }
      }
    }
  }, [user, filteredCourses, studentRegistry, selectedIntake.id]);

  const handleCapture = async () => {
    setIsCapturing(true);
    try {
      const doc = new jsPDF();
      const courseName = selectedCourseId ? COURSES.find(c => c.id === selectedCourseId)?.name : 'Program';
      const intakeName = uploadedData && selectedCourseId && uploadedData[selectedCourseId] 
        ? uploadedData[selectedCourseId][selectedUploadedIntake]?.name 
        : selectedIntake.date;

      doc.setFontSize(20);
      doc.setTextColor(44, 62, 80);
      doc.text('Academic Timetable', 105, 15, { align: 'center' });
      
      doc.setFontSize(12);
      doc.setTextColor(127, 140, 141);
      doc.text(`${courseName}`, 105, 22, { align: 'center' });

      doc.setFontSize(10);
      doc.setTextColor(51, 51, 51);
      const subtitle = `The following timetable is designated for students commencing their studies on ${intakeName}.`;
      doc.text(subtitle, 105, 32, { align: 'center' });

      const tableData = timetable.map(row => [
        row.startDate,
        row.endDate,
        row.intakeCode
      ]);

      autoTable(doc, {
        startY: 40,
        head: [['Start Date', 'End Date', 'Units']],
        body: tableData,
        theme: 'grid',
        headStyles: { 
          fillColor: [52, 73, 94], 
          textColor: [255, 255, 255],
          fontSize: 10,
          fontStyle: 'bold',
          halign: 'center'
        },
        columnStyles: {
          0: { halign: 'center', cellWidth: 50 },
          1: { halign: 'center', cellWidth: 50 },
          2: { halign: 'left' }
        },
        styles: {
          fontSize: 9,
          cellPadding: 4,
          valign: 'middle'
        },
        margin: { top: 40 }
      });

      doc.save(`Institutional_Schedule_${selectedCourseId || 'course'}_${intakeName.replace(/\s+/g, '_')}.pdf`);
    } catch (error) {
      console.error('PDF Generation Error:', error);
      alert('Error generating PDF. Please try again.');
    } finally {
      setIsCapturing(false);
    }
  };

  const handleFileUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const target = event.target;
      if (!target) return;
      
      try {
        const data = new Uint8Array(target.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array', cellDates: true });
        
        const categorizedData: Record<string, { name: string, rows: TimetableRow[] }[]> = {
          'unassigned': []
        };

        const formatDate = (val: any) => {
          if (!val) return 'N/A';
          if (val instanceof Date) {
             return val.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ /g, '/');
          }
          if (typeof val === 'number') {
            try {
              const date = XLSX.SSF.parse_date_code(val);
              const d = new Date(date.y, date.m - 1, date.d);
              return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ /g, '/');
            } catch { return String(val); }
          }
          return String(val);
        };

        workbook.SheetNames.forEach((sheetName) => {
          const worksheet = workbook.Sheets[sheetName];
          const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
          if (rows.length === 0) return;

          let assignedCourseId = 'unassigned';
          const courseMatch = COURSES.find(c => 
            sheetName.toLowerCase().includes(c.id.toLowerCase()) || 
            sheetName.toLowerCase().includes(c.name.toLowerCase()) ||
            c.name.split(' ').some(word => word.length > 3 && sheetName.toLowerCase().includes(word.toLowerCase()))
          );
          if (courseMatch) assignedCourseId = courseMatch.id;

          let maxCols = 0;
          rows.forEach(r => { if (r && r.length > maxCols) maxCols = r.length; });

          let weekCol = -1, startCol = -1, endCol = -1;
          for (let r = 0; r < Math.min(rows.length, 150); r++) {
            const row = rows[r];
            if (!row) continue;
            row.forEach((cell, c) => {
              const val = String(cell || '').toLowerCase().replace(/[^a-z0-1]/g, '');
              if (val.includes('start') || val.includes('commence') || val.includes('fromdate')) startCol = c;
              if (val.includes('end') || val.includes('finish') || val.includes('todate')) endCol = c;
              if (val.includes('week') || (val === 'no' && c < 5)) weekCol = c;
            });
            if (startCol !== -1 && endCol !== -1) break;
          }

          if (startCol === -1) startCol = 1;
          if (endCol === -1) endCol = 2;
          if (weekCol === -1) weekCol = 0;

          const detectedIntakeCols = new Map<number, string>();
          for (let c = 0; c < maxCols; c++) {
            let hasIntakeHeader = false;
            let groupName = '';
            for (let r = 0; r < Math.min(rows.length, 200); r++) {
              const val = String(rows[r]?.[c] || '').toLowerCase().trim();
              const keywords = ['intake', 'unit code', 'module', 'unit of competency', 'subject', 'crn', 'code', 'group'];
              if (keywords.some(k => val.includes(k))) {
                hasIntakeHeader = true;
                for (let lookUp = r; lookUp >= Math.max(0, r-8); lookUp--) {
                  const cellVal = String(rows[lookUp]?.[c] || '').trim();
                  if (cellVal.toLowerCase().includes('group') || cellVal.toLowerCase().includes('intake') || cellVal.toLowerCase().includes('cohort')) {
                    groupName = cellVal;
                    break;
                  }
                }
                break;
              }
            }
            if (!hasIntakeHeader) {
               let modulePatterns = 0;
               for (let r = 0; r < Math.min(rows.length, 150); r++) {
                 const cellText = String(rows[r]?.[c] || '');
                 if (/^[A-Z]{2,}[0-9]{3,}/i.test(cellText) || /^SIT[0-9]/i.test(cellText)) modulePatterns++;
               }
               if (modulePatterns > 3) hasIntakeHeader = true;
            }
            if (hasIntakeHeader) {
              detectedIntakeCols.set(c, groupName || `Sheet: ${sheetName} (Col ${XLSX.utils.encode_col(c)})`);
            }
          }

          detectedIntakeCols.forEach((groupHeader, iCol) => {
            const intakeRows: TimetableRow[] = [];
            let sheetCourseId = assignedCourseId;
            const cleanName = groupHeader.replace(/^Sheet:\s*/i, '').replace(/\s*\(Col\s+[A-Z]+\)$/i, '');

            rows.forEach((row, rowIndex) => {
              if (!row || rowIndex < (startCol === -1 ? 0 : 1)) return;
              const sVal = row[startCol];
              const eVal = row[endCol];
              const cVal = String(row[iCol] || '').trim();
              
              if (!sVal || (typeof sVal === 'string' && /[^0-9\/\-a-zA-Z\s]/.test(sVal))) return;
              if (typeof sVal === 'string' && (sVal.toLowerCase().includes('start') || sVal.toLowerCase().includes('date'))) return;
              
              const hasStartValue = sVal instanceof Date || (typeof sVal === 'number' && sVal > 30000) || (typeof sVal === 'string' && sVal.length > 5);
              const isBreak = cVal.toLowerCase().includes('break') || row.some(cell => String(cell || '').toLowerCase().includes('break'));
              
              if (!hasStartValue && !isBreak) return;

              if (sheetCourseId === 'unassigned') {
                 COURSES.forEach(course => {
                    const cName = course.name.toLowerCase();
                    const cid = course.id.toLowerCase();
                    if (cVal.toLowerCase().includes(cid) || groupHeader.toLowerCase().includes(cName) || sheetName.toLowerCase().includes(cName)) {
                       sheetCourseId = course.id;
                    }
                 });
              }

              intakeRows.push({
                week: Number(row[weekCol]) || (intakeRows.length + 1),
                startDate: formatDate(sVal),
                endDate: formatDate(eVal),
                intakeCode: isBreak ? 'Institutional Break' : (cVal || 'No Session'),
                mode: isBreak ? 'Paused' : 'Standard',
                isCurrent: false,
                isBreak: isBreak
              });
            });

            if (intakeRows.length > 2) {
              if (!categorizedData[sheetCourseId]) categorizedData[sheetCourseId] = [];
              categorizedData[sheetCourseId].push({
                name: cleanName,
                rows: intakeRows
              });
            }
          });
        });

        const totalFound = Object.values(categorizedData).flat().length;
        if (totalFound === 0) {
          alert("No valid timetable data detected. Please ensure your Excel file contains columns for 'Start Date' and 'End Date', and that the unit codes are clearly identifiable.");
          return;
        }

        setUploadedData(categorizedData);
        try {
          const uploadedRef = doc(db, 'system', 'uploadedTimetable');
          await setDoc(uploadedRef, { data: categorizedData, updatedAt: serverTimestamp() });
        } catch (err) {
          console.error("Error saving timetable to Firestore:", err);
        }
        alert(`Successfully imported ${totalFound} intake schedules across ${Object.keys(categorizedData).length} courses.`);
        setActiveTab('admin');
      } catch (error) {
        console.error("Excel Processing Error:", error);
        alert("There was an error reading your Excel file. Please check the console for details.");
      } finally {
        e.target.value = '';
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleStudentRegistryUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const target = event.target;
      if (!target) return;
      
      try {
        const data = new Uint8Array(target.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array', cellDates: true });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const rows = XLSX.utils.sheet_to_json(worksheet) as any[];
        
        const formatDate = (val: any) => {
          if (!val) return '';
          if (val instanceof Date) {
            return val.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
          }
          if (typeof val === 'number') {
            try {
              const date = XLSX.SSF.parse_date_code(val);
              const d = new Date(date.y, date.m - 1, date.d);
              return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
            } catch { return String(val); }
          }
          return String(val);
        };

        const mappedStudents = rows.map(row => {
          const r: any = {};
          Object.keys(row).forEach(k => {
            r[k.trim().toLowerCase()] = row[k];
          });

          return {
            name: String(r.username || r.name || ''),
            email: String(r.email || '').trim(),
            password: String(r.password || ''),
            qualification: String(r.qualification || '').trim(),
            intakeDate: formatDate(r['intakes dates'] || r['intake date'] || r.intakedate).trim()
          };
        }).filter(s => s.email && s.qualification);

        if (mappedStudents.length === 0) {
          alert('No valid student records found. Please check your Excel headers: "Username", "Email", "Password", "Qualification", "Intakes Dates"');
        } else {
          setStudentRegistry(mappedStudents);
          try {
            const registryRef = doc(db, 'system', 'studentRegistry');
            await setDoc(registryRef, { data: mappedStudents, updatedAt: serverTimestamp() });
          } catch (err) {
            console.error("Error saving registry to Firestore:", err);
          }
          alert(`Successfully imported ${mappedStudents.length} student records.`);
        }
      } catch (error) {
        console.error('Student Registry Upload Error:', error);
        alert('Parsing error. Please ensure the file is an Excel spreadsheet.');
      } finally {
        e.target.value = '';
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const syncRegistryToFirestore = async (list: any[]) => {
    try {
      const registryRef = doc(db, 'system', 'studentRegistry');
      await setDoc(registryRef, { data: list, updatedAt: serverTimestamp() });
    } catch (err) { console.error(err); }
  };

  if (authLoading) {
    return (
      <div className="h-screen bg-[#f0ede8] flex items-center justify-center overflow-hidden">
        <div className="flex flex-col items-center gap-6">
          <div className="w-16 h-16 bg-[#58334a] rounded-2xl flex items-center justify-center shadow-2xl animate-pulse">
            <Cpu className="text-white w-8 h-8" />
          </div>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-[0.3em] animate-pulse font-sans">Initializing Portal...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginPage onLoginSuccess={() => {}} />;
  }

  const menuItems = [
    { id: 'dashboard', icon: Layout, label: 'Timetable Dashboard' },
    { id: 'lms', icon: BookOpen, label: 'LMS Dashboard' },
    { id: 'moodle', icon: BookOpen, label: 'SMS Dashboard' },
    { id: 'outlook', icon: Mail, label: 'College Email' },
    { id: 'settings', icon: Settings, label: 'Settings' },
  ];

  if (isAdmin) {
    menuItems.push({ id: 'admin', icon: ShieldCheck, label: 'Admin Panel' });
  }

  const renderContent = () => {
    if (activeTab === 'dashboard') {
      return (
        <Dashboard 
          selectedCourseId={selectedCourseId}
          setSelectedCourseId={setSelectedCourseId}
          filteredCourses={filteredCourses}
          uploadedData={uploadedData}
          selectedUploadedIntake={selectedUploadedIntake}
          selectedIntake={selectedIntake}
          timetable={timetable}
          handleCapture={handleCapture}
          isCapturing={isCapturing}
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
          rowsPerPage={ROWS_PER_PAGE}
          setSelectedWeek={setSelectedWeek}
          setSelectedDayDetail={setSelectedDayDetail}
          setIsDetailModalOpen={setIsDetailModalOpen}
          activeTab={activeTab}
        />
      );
    }
    if (activeTab === 'lms') {
      return (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center min-h-[60vh] text-center p-12 max-w-2xl mx-auto"
        >
          <motion.div 
            whileHover={{ scale: 1.1, rotate: 5 }}
            className="w-24 h-24 bg-white rounded-[2rem] border border-[#ebe9e4] shadow-xl shadow-purple-900/5 flex items-center justify-center mb-10 transition-all cursor-pointer"
          >
            <Layout size={40} className="text-[#58334a]" />
          </motion.div>
          <h2 className="text-4xl font-bold tracking-[0.5px] text-slate-900 mb-5 font-sans">LMS Dashboard</h2>
          <p className="text-slate-500 font-bold text-base leading-relaxed mb-12 opacity-70 font-sans">Access your digital course materials, assignments, and learning resources through our LMS infrastructure.</p>
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-10 py-5 bg-[#58334a] text-white rounded-2xl font-medium text-xs uppercase tracking-[0.2em] shadow-2xl shadow-purple-900/20 transition-all font-sans"
          >
            Launch LMS Portal
          </motion.button>
        </motion.div>
      );
    }
    if (activeTab === 'settings') {
      return (
        <SettingsPanel 
          user={user}
          userData={userData}
          isEditingProfile={isEditingProfile}
          setIsEditingProfile={setIsEditingProfile}
          editName={editName}
          setEditName={setEditName}
          editPhone={editPhone}
          setEditPhone={setEditPhone}
          isUpdating={isUpdating}
          handleUpdateProfile={handleUpdateProfile}
          photoInputRef={photoInputRef}
          handlePhotoUpload={handlePhotoUpload}
          selectedIntake={selectedIntake}
        />
      );
    }
    if (activeTab === 'moodle') {
      return (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center min-h-[60vh] text-center p-12 max-w-2xl mx-auto"
        >
          <motion.div 
            whileHover={{ scale: 1.1, rotate: -5 }}
            className="w-24 h-24 bg-white rounded-[2rem] border border-[#ebe9e4] shadow-xl shadow-purple-900/5 flex items-center justify-center mb-10 transition-all cursor-pointer"
          >
            <BookOpen size={40} className="text-[#58334a]" />
          </motion.div>
          <h2 className="text-4xl font-bold tracking-[0.5px] text-slate-900 mb-5 font-sans">Student Dashboard</h2>
          <p className="text-slate-500 font-bold text-base leading-relaxed mb-12 opacity-70 font-sans">Access your student records, digital transcripts, and enrollment status through our centralized management system.</p>
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-10 py-5 bg-[#58334a] text-white rounded-2xl font-medium text-xs uppercase tracking-[0.2em] shadow-2xl shadow-purple-900/20 transition-all font-sans"
          >
            Launch SMS Portal
          </motion.button>
        </motion.div>
      );
    }
    if (activeTab === 'outlook') {
      return (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center min-h-[60vh] text-center p-12 max-w-2xl mx-auto"
        >
          <motion.div 
            whileHover={{ scale: 1.1, y: -5 }}
            className="w-24 h-24 bg-white rounded-[2rem] border border-[#ebe9e4] shadow-xl shadow-purple-900/5 flex items-center justify-center mb-10 transition-all cursor-pointer"
          >
            <Mail size={40} className="text-[#b36688]" />
          </motion.div>
          <h2 className="text-4xl font-bold tracking-[0.5px] text-slate-900 mb-5 font-sans">College Mailbox</h2>
          <p className="text-slate-500 font-bold text-base leading-relaxed mb-12 opacity-70 font-sans">Stay connected with faculty members and peers via your institutional email account provided by The College.</p>
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-10 py-5 border-[2px] border-[#58334a] text-[#58334a] hover:bg-[#58334a] hover:text-white rounded-2xl font-medium text-xs uppercase tracking-[0.2em] shadow-xl shadow-purple-900/10 transition-all font-sans"
          >
            Proceed to Inbox
          </motion.button>
        </motion.div>
      );
    }
    if (activeTab === 'admin') {
      return (
        <AdminPanel 
          isAdmin={isAdmin}
          uploadedData={uploadedData}
          setUploadedData={setUploadedData}
          studentRegistry={studentRegistry}
          setStudentRegistry={setStudentRegistry}
          fileInputRef={fileInputRef}
          handleFileUpload={handleFileUpload}
          studentRegistryInputRef={studentRegistryInputRef}
          handleStudentRegistryUpload={handleStudentRegistryUpload}
          setSelectedCourseId={setSelectedCourseId}
          setSelectedUploadedIntake={setSelectedUploadedIntake}
          setActiveTab={setActiveTab}
          showMasterLedger={showMasterLedger}
          setShowMasterLedger={setShowMasterLedger}
          isLightMode={isLightMode}
          COURSES={COURSES}
          syncRegistryToFirestore={syncRegistryToFirestore}
        />
      );
    }
    return null;
  };

  return (
    <div className="h-screen bg-[#f0ede8] flex text-slate-800 font-body transition-colors duration-500 relative overflow-hidden">
      {/* Background Architecture */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover z-0 opacity-40"
        >
          <source src="https://tan-occasional-flamingo-688.mypinata.cloud/ipfs/bafybeifoqakzost77ivg3vkvlm7eoollja6h67jt3rm7p5flgfvcha6ne4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-[#f0ede8]/20 backdrop-blur-[2px]" />
      </div>

      <DetailModal 
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        selectedWeek={selectedWeek}
        selectedDayDetail={selectedDayDetail}
        setSelectedDayDetail={setSelectedDayDetail}
      />

      <CropModal 
        isOpen={isCropModalOpen}
        onClose={() => setIsCropModalOpen(false)}
        imageToCrop={imageToCrop}
        crop={crop}
        setCrop={setCrop}
        zoom={zoom}
        setZoom={setZoom}
        onCropComplete={onCropComplete}
        handleApplyCrop={handleApplyCrop}
        isUpdating={isUpdating}
      />

      <div className="lg:hidden fixed top-0 left-0 right-0 h-20 bg-white/90 backdrop-blur-md border-b border-white shadow-md z-[60] flex items-center justify-between px-8">
        <div className="flex items-center gap-5">
          <div className="w-14 h-14 bg-[#58334a] rounded-2xl flex items-center justify-center shadow-lg shadow-purple-900/10">
            <Cpu className="text-white w-8 h-8" />
          </div>
          <span className="text-2xl font-bold font-sans text-slate-900 tracking-tight">The College</span>
        </div>
        <button 
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 rounded-xl bg-slate-50 text-[#58334a] hover:bg-slate-100 transition-colors"
        >
          {isMobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
        </button>
      </div>

      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsMobileMenuOpen(false)}
            className="lg:hidden fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[70]"
          />
        )}
      </AnimatePresence>

      <Sidebar 
        user={user!}
        userData={userData}
        studentRegistry={studentRegistry}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        setSelectedCourseId={setSelectedCourseId}
        isMobileMenuOpen={isMobileMenuOpen}
        setIsMobileMenuOpen={setIsMobileMenuOpen}
        menuItems={menuItems}
      />

      <motion.main 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 0.2 }}
        className="flex-1 lg:ml-[20%] px-4 lg:px-6 py-16 lg:py-6 h-screen overflow-y-auto relative z-10 flex flex-col items-start w-full lg:w-[80%] custom-scrollbar"
      >
        <div className="w-full flex justify-end mb-2">
          <div className="hidden md:flex items-center gap-4 bg-white/10 backdrop-blur-[80px] px-5 py-2.5 rounded-2xl border border-white/20 shadow-[20px_0_40px_-15px_rgba(0,0,0,0.05),inset_0_1px_2px_0_rgba(255,255,255,0.4)]">
            <div className="flex flex-center gap-2">
              <span className="text-[12px] font-bold font-sans text-[#58334a] tracking-[0.2em] uppercase">RTO:</span>
              <span className="text-[12px] font-bold text-slate-800 tabular-nums font-sans">Demo</span>
            </div>
            <div className="w-px h-3 bg-[#58334a]/10" />
            <div className="flex items-center gap-2">
              <span className="text-[12px] font-bold font-sans text-[#58334a] tracking-[0.2em] uppercase">CRICOS:</span>
              <span className="text-[12px] font-bold text-slate-800 tabular-nums font-sans">Demo</span>
            </div>
          </div>
        </div>

        <Header 
          activeTab={activeTab}
          selectedCourseId={selectedCourseId}
          filteredCourses={filteredCourses}
        />

        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab + (selectedCourseId || '')}
            className="w-full"
            initial={{ opacity: 0, y: 30, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.98 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          >
            {renderContent()}
          </motion.div>
        </AnimatePresence>
      </motion.main>
    </div>
  );
}

export default App;
