/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useMemo, useRef, useEffect, ChangeEvent } from 'react';
import { motion, AnimatePresence, useScroll, useSpring } from 'motion/react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { 
  Calendar, 
  ChevronDown, 
  ChevronUp,
  Download,
  Search,
  Menu,
  Moon,
  Sun,
  Loader2,
  Upload,
  X,
  LogOut,
  User as UserIcon,
  Mail,
  Settings,
  BookOpen,
  Layout,
  ArrowRight,
  ArrowLeft,
  Globe,
  ShieldCheck,
  ShieldAlert,
  Camera,
  Edit2,
  Check,
  CheckCircle2,
  Coffee,
  Phone,
  Hash,
  Cpu,
  Trash2,
  Users,
  Database,
  Clock
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { onAuthStateChanged, signOut, User, updateProfile, sendPasswordResetEmail } from 'firebase/auth';
import Cropper, { Area } from 'react-easy-crop';
import { auth, db } from './lib/firebase';
import { doc, setDoc, serverTimestamp, getDoc } from 'firebase/firestore';
import { INTAKE_OPTIONS, MODULE_MAPPING, DEFAULT_MODE, COURSE_NAME, COURSE_BASE_DATE } from './constants';
import { TimetableRow, Theme } from './types';
import LoginPage from './components/LoginPage';

// Helper to format date and add weeks
const getWeekDates = (startDateStr: string, weekIndex: number) => {
  const start = new Date(startDateStr);
  start.setDate(start.getDate() + (weekIndex * 7));
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  const format = (d: Date) => d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' }).replace(/ /g, '-');
  return { start: format(start), end: format(end) };
};

const COURSES = [
  { id: 'c3cc', name: 'Certificate III in Commercial Cookery (SIT30821)', color: 'bg-emerald-500', icon: Globe, desc: 'Professional certification (52 Weeks) for aspiring commercial chefs in diverse kitchen environments.' },
  { id: 'c4km', name: 'Certificate IV in Kitchen Management (SIT40521)', color: 'bg-indigo-600', icon: Layout, desc: 'Advanced leadership (104 Weeks) and operational management for large-scale culinary operations.' },
  { id: 'c3pat', name: 'Certificate III in Patisserie (SIT30121)', color: 'bg-rose-500', icon: BookOpen, desc: 'Specialized training (52 Weeks) in fine pastries, desserts, and bakery production management.' },
  { id: 'c4pat', name: 'Certificate IV in Patisserie (SIT40721)', color: 'bg-violet-600', icon: Globe, desc: 'Expert-level patisserie techniques (104 Weeks) and strategic boutique management.' },
  { id: 'nsdhm', name: 'Diploma of Hospitality Management (SIT50422)', color: 'bg-sky-600', icon: Layout, desc: 'Comprehensive management training (52 Weeks) for the global hospitality and services sector.' },
  { id: 'nsadv', name: 'Advanced Diploma of Hospitality Management (SIT60322)', color: 'bg-amber-600', icon: BookOpen, desc: 'Executive-level leadership development (104 Weeks) for senior hospitality administration.' },
  { id: 'csdhm', name: 'Diploma of Hospitality Management (Cookery) (SIT50422)', color: 'bg-slate-800', icon: Globe, desc: 'Specialized management path (52 Weeks) for cookery professionals transition to operations.' },
  { id: 'csadv', name: 'Advanced Diploma of Hospitality Management (Cookery) (SIT60322)', color: 'bg-slate-900', icon: Layout, desc: 'Advanced executive leadership (104 Weeks) for commercial cookery and hospitality operations.' },
  { id: 'psdhm', name: 'Diploma of Hospitality Management (Patisserie) (SIT50422)', color: 'bg-rose-600', icon: BookOpen, desc: 'Operational management training (52 Weeks) tailored for specialized patisserie environments.' },
  { id: 'psadv', name: 'Advanced Diploma of Hospitality Management (Patisserie) (SIT60322)', color: 'bg-rose-900', icon: Layout, desc: 'High-level strategic management (104 Weeks) for premium patisserie and confectionery sectors.' },
];

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'moodle' | 'outlook' | 'admin' | 'settings'>('dashboard');
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const ROWS_PER_PAGE = 10;

  const [selectedIntake, setSelectedIntake] = useState(INTAKE_OPTIONS[2]);
  const [currentTheme, setCurrentTheme] = useState<Theme>('clean-modern');
  const [isLightMode, setIsLightMode] = useState(true);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedModule, setSelectedModule] = useState<TimetableRow | null>(null);
  const [uploadedData, setUploadedData] = useState<Record<string, { name: string, rows: TimetableRow[] }[]> | null>(null);
  const [showMasterLedger, setShowMasterLedger] = useState(true);
  const [studentRegistry, setStudentRegistry] = useState<{name: string, email: string, password: string, qualification: string, intakeDate: string}[] | null>(null);
  const [selectedUploadedIntake, setSelectedUploadedIntake] = useState<number>(0);
  const timetableRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const studentRegistryInputRef = useRef<HTMLInputElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);

  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editStudentId, setEditStudentId] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [userData, setUserData] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [weekDetailsMap, setWeekDetailsMap] = useState<Record<string, { time: string, trainers: string }>>({});
  const [isSavingWeek, setIsSavingWeek] = useState(false);
  const [quickJumpWeek, setQuickJumpWeek] = useState('');
  const [quickJumpDate, setQuickJumpDate] = useState('');

  // Cropping States
  const [imageToCrop, setImageToCrop] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [isCropModalOpen, setIsCropModalOpen] = useState(false);

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
        // Hardcoded admin check for the user's email
        const ADMIN_EMAIL = 'dg2723777@gmail.com';
        const isHardcodedAdmin = user.email === ADMIN_EMAIL;
        
        // Also check Firestore admins collection
        const adminDocRef = doc(db, 'admins', user.uid);
        const adminDocSnap = await getDoc(adminDocRef);
        
        setIsAdmin(isHardcodedAdmin || adminDocSnap.exists());

        const docRef = doc(db, 'users', user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setUserData(docSnap.data());
          setEditName(user.displayName || docSnap.data().displayName || '');
          setEditPhone(docSnap.data().phone || '');
          setEditStudentId(docSnap.data().studentId || '');
          
          if (docSnap.data().weekDetails) {
            setWeekDetailsMap(docSnap.data().weekDetails);
          }
        }
      }
    };
    fetchUserData();
  }, [user]);

  const saveWeekData = async (week: number, time: string, trainers: string) => {
    if (!user || !selectedCourseId) return;
    setIsSavingWeek(true);
    try {
      const intakeKey = uploadedData ? `uploaded_${selectedUploadedIntake}` : selectedIntake.id;
      const weekKey = `${selectedCourseId}_${intakeKey}_w${week}`;
      const newMap = {
        ...weekDetailsMap,
        [weekKey]: { time, trainers }
      };
      
      const userRef = doc(db, 'users', user.uid);
      await setDoc(userRef, {
        weekDetails: newMap,
        updatedAt: serverTimestamp()
      }, { merge: true });
      
      setWeekDetailsMap(newMap);
      setIsDetailModalOpen(false);
    } catch (error) {
      console.error("Error saving week details:", error);
    } finally {
      setIsSavingWeek(false);
    }
  };

  const resizeImage = (base64Str: string, maxWidth = 120, maxHeight = 120): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = base64Str;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height *= maxWidth / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width *= maxHeight / height;
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        // Using low quality to stay under 2048 characters if possible
        resolve(canvas.toDataURL('image/jpeg', 0.6));
      };
    });
  };

  const getCroppedImg = (imageSrc: string, pixelCrop: Area): Promise<string> => {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.src = imageSrc;
      image.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          reject(new Error('No 2d context'));
          return;
        }

        canvas.width = pixelCrop.width;
        canvas.height = pixelCrop.height;

        ctx.drawImage(
          image,
          pixelCrop.x,
          pixelCrop.y,
          pixelCrop.width,
          pixelCrop.height,
          0,
          0,
          pixelCrop.width,
          pixelCrop.height
        );

        resolve(canvas.toDataURL('image/jpeg'));
      };
      image.onerror = (error) => reject(error);
    });
  };

  const handlePhotoUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    const reader = new FileReader();
    reader.onload = () => {
      setImageToCrop(reader.result as string);
      setIsCropModalOpen(true);
      // Reset input value so the same file can be selected again
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
      
      // Create a very small thumbnail for Firebase Auth (limit is 2048 chars)
      const authThumb = await resizeImage(croppedImage, 48, 48);
      const finalAuthUrl = authThumb.length <= 2048 ? authThumb : '';
      
      // Create a slightly better one for Firestore (1MB limit)
      const firestoreImage = await resizeImage(croppedImage, 400, 400);
      
      // Update Firebase Auth Profile
      try {
        await updateProfile(user, { photoURL: finalAuthUrl });
      } catch (authErr) {
        console.warn("Could not update Auth photoURL (size limit), skipping Auth update but continuing with Firestore:", authErr);
      }
      
      // Update Firestore
      const userRef = doc(db, 'users', user.uid);
      await setDoc(userRef, { 
        photoURL: firestoreImage,
        updatedAt: serverTimestamp() 
      }, { merge: true });
      
      // Refresh local state
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
      // Update Auth Profile (only for displayName)
      await updateProfile(user, { displayName: editName });
      
      // Update Firestore
      const userRef = doc(db, 'users', user.uid);
      await setDoc(userRef, {
        displayName: editName,
        phone: editPhone,
        studentId: editStudentId,
        updatedAt: serverTimestamp()
      }, { merge: true });
      
      setUser({...user, displayName: editName} as User);
      setUserData(prev => ({...prev, displayName: editName, phone: editPhone, studentId: editStudentId}));
      setIsEditingProfile(false);
    } catch (error) {
      console.error("Error updating profile:", error);
    } finally {
      setIsUpdating(false);
    }
  };

  const [selectedWeek, setSelectedWeek] = useState<TimetableRow | null>(null);
  const [selectedDayDetail, setSelectedDayDetail] = useState<{day: number, month: number, year: number} | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  const jumpToWeek = (weekNum: number) => {
    if (isNaN(weekNum) || weekNum < 1) return;
    const targetPage = Math.ceil(weekNum / ROWS_PER_PAGE);
    if (targetPage >= 1 && targetPage <= Math.ceil(timetable.length / ROWS_PER_PAGE)) {
      setCurrentPage(targetPage);
    }
  };

  const jumpToDate = (selectedDate: string) => {
    if (!selectedDate) return;
    const target = new Date(selectedDate);
    
    const targetIndex = timetable.findIndex(row => {
      const partsStart = row.startDate.split('-');
      const partsEnd = row.endDate.split('-');
      
      const months: Record<string, number> = {
        'Jan': 0, 'Feb': 1, 'Mar': 2, 'Apr': 3, 'May': 4, 'Jun': 5,
        'Jul': 6, 'Aug': 7, 'Sep': 8, 'Oct': 9, 'Nov': 10, 'Dec': 11
      };
      
      const start = new Date(2000 + parseInt(partsStart[2]), months[partsStart[1]] || 0, parseInt(partsStart[0]));
      const end = new Date(2000 + parseInt(partsEnd[2]), months[partsEnd[1]] || 0, parseInt(partsEnd[0]));
      
      return target >= start && target <= end;
    });

    if (targetIndex !== -1) {
      setCurrentPage(Math.ceil((targetIndex + 1) / ROWS_PER_PAGE));
    }
  };

  const parseDateString = (dateStr: string) => {
    const parts = dateStr.split('-');
    if (parts.length !== 3) return new Date();
    const d = parseInt(parts[0]);
    const m = parts[1];
    const y = 2000 + parseInt(parts[2]);
    const months: Record<string, number> = {
      'Jan': 0, 'Feb': 1, 'Mar': 2, 'Apr': 3, 'May': 4, 'Jun': 5,
      'Jul': 6, 'Aug': 7, 'Sep': 8, 'Oct': 9, 'Nov': 10, 'Dec': 11
    };
    return new Date(y, months[m] || 0, d);
  };

  const getCalendarDays = (date: Date) => {
    const month = date.getMonth();
    const year = date.getFullYear();
    if (isNaN(month) || isNaN(year)) return []; // Safety check
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const prevMonthDays = new Date(year, month, 0).getDate();
    
    const days = [];
    
    // Previous month overlap
    for (let i = firstDay - 1; i >= 0; i--) {
      days.push({
        day: prevMonthDays - i,
        month: month - 1,
        year: month === 0 ? year - 1 : year,
        isCurrentMonth: false
      });
    }
    
    // Current month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({
        day: i,
        month,
        year,
        isCurrentMonth: true
      });
    }
    
    // Next month overlap
    const remaining = 42 - days.length;
    for (let i = 1; i <= remaining; i++) {
      days.push({
        day: i,
        month: month + 1,
        year: month === 11 ? year + 1 : year,
        isCurrentMonth: false
      });
    }
    
    return days;
  };

  const APPLE_SPRING = { type: "spring", stiffness: 260, damping: 30, mass: 1 };
  const FLUID_TRANSITION = { duration: 0.8, ease: [0.32, 0.72, 0, 1] };

  const { scrollY, scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });
  const [showScrollTop, setShowScrollTop] = useState(false);
  
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
        // Sync user profile - basic info only to prevent overwriting high-res photo
        try {
          const userRef = doc(db, 'users', currentUser.uid);
          await setDoc(userRef, {
            uid: currentUser.uid,
            email: currentUser.email,
            displayName: currentUser.displayName,
            // photoURL is handled via handleApplyCrop to allow high-res storage
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

  useEffect(() => {
    // Small delay to ensure all animations and layouts are stabilized
    const timer = setTimeout(() => {
      const currentElement = document.querySelector('[data-current="true"]');
      if (currentElement) {
        currentElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 800);
    return () => clearTimeout(timer);
  }, [currentTheme, selectedIntake, user]);

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
    // Check registry first
    const registeredUser = studentRegistry?.find(s => s.email.toLowerCase() === user?.email?.toLowerCase());
    if (registeredUser) {
      const q = registeredUser.qualification.toLowerCase();
      return COURSES.filter(c => 
        q.includes(c.id.toLowerCase()) || 
        c.name.toLowerCase().includes(q) ||
        q.includes(c.name.toLowerCase())
      );
    }

    if (user?.email === 'student1@college.edu.au') {
      return COURSES.filter(c => c.id === 'c3cc' || c.id === 'c4pat');
    }
    if (user?.email === 'student2@college.edu.au') {
      return COURSES.filter(c => c.id === 'c4km');
    }
    return COURSES;
  }, [user, studentRegistry]);

  useEffect(() => {
    // Auto-select intake date if registered
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
          // If no match in pre-defined options, create a custom one from registry
          // Ensure we don't set it if it's already set to the same to avoid loops
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

      // Header
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
                // Peek above for group identifying labels
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

            // Clean up group name for display
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
        // Persist to Firestore
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
        e.target.value = ''; // Reset input to allow re-uploading the same file
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
          // Normalize keys: trim and lowercase to make header matching robust
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
          // Persist to Firestore
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


const renderTimeline = () => {
  const totalPages = Math.ceil(timetable.length / ROWS_PER_PAGE);
  const paginatedRows = timetable.slice(
    (currentPage - 1) * ROWS_PER_PAGE,
    currentPage * ROWS_PER_PAGE
  );

  const getPageNumbers = () => {
    const pages: (number | '...')[] = [];
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    pages.push(1);
    if (currentPage > 3) pages.push('...');
    for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
      pages.push(i);
    }
    if (currentPage < totalPages - 2) pages.push('...');
    pages.push(totalPages);
    return pages;
  };

  return (
    <div className="space-y-4 w-full">

      {/* Glassmorphism Table Container */}
      <div className="relative rounded-[32px] overflow-hidden border border-white/50 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.10),inset_0_1px_2px_0_rgba(255,255,255,0.9)] bg-white/40 backdrop-blur-[40px]">

        {/* Ambient light sweep */}
        <motion.div
          animate={{ x: ['-100%', '300%'] }}
          transition={{ duration: 14, repeat: Infinity, ease: "easeInOut", repeatDelay: 6 }}
          className="absolute inset-0 pointer-events-none bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-[-35deg] z-10 opacity-50"
        />

        {/* Pagination — moved above header */}
        {totalPages > 1 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex items-center justify-between px-8 py-3.5 border-b border-white/20 bg-white/10 backdrop-blur-[80px] relative z-20 shadow-[inset_0_-1px_0_rgba(255,255,255,0.2)]"
          >
            <div className="flex items-center gap-2 ml-auto">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/20 backdrop-blur-md border border-white/30 shadow-sm text-[12px] font-bold uppercase tracking-[0.15em] text-slate-500 hover:text-[#58334a] hover:border-[#58334a]/20 hover:bg-white/40 disabled:opacity-30 disabled:pointer-events-none transition-all duration-200"
              >
                <ArrowLeft size={16} /> Prev
              </button>

              <div className="flex items-center gap-1.5">
                {getPageNumbers().map((page, i) =>
                  page === '...' ? (
                    <span key={`ellipsis-${i}`} className="px-2 text-[#58334a]/20 text-[11px] font-bold select-none">···</span>
                  ) : (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page as number)}
                      className={`w-9 h-9 rounded-xl text-[12px] font-bold transition-all duration-200 ${
                        currentPage === page
                          ? 'bg-[#58334a] text-white shadow-lg shadow-purple-900/20 border border-[#58334a]'
                          : 'bg-white/20 backdrop-blur-md border border-white/30 text-slate-500 hover:text-[#58334a] hover:bg-white/40 hover:border-[#58334a]/20'
                      }`}
                    >
                      {page}
                    </button>
                  )
                )}
              </div>

              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/20 backdrop-blur-md border border-white/30 shadow-sm text-[13px] font-bold uppercase tracking-[0.15em] text-slate-500 hover:text-[#58334a] hover:border-[#58334a]/20 hover:bg-white/40 disabled:opacity-30 disabled:pointer-events-none transition-all duration-200"
              >
                Next <ArrowRight size={16} />
              </button>
            </div>
          </motion.div>
        )}

        {/* Header Row */}
        <div className="grid grid-cols-[1fr_2fr] md:grid-cols-[1fr_2fr_2fr] px-4 md:px-8 py-3.5 border-b border-white/20 bg-white/5 backdrop-blur-[80px] relative z-20 shadow-[inset_0_-1px_0_rgba(255,255,255,0.1)]">
          <span className="text-[13px] md:text-[16px] font-bold font-sans text-[#58334a] tracking-[0.1em]">Weeks</span>
          <span className="text-[13px] md:text-[16px] font-bold font-sans text-[#58334a] tracking-[0.1em]">Intakes Dates</span>
          <span className="hidden md:block text-[16px] font-bold font-sans text-[#58334a] tracking-[0.1em]">Unit of Competency Code</span>
        </div>

        {/* Card Rows */}
        <div className="divide-y divide-white/30 relative z-20">
          {paginatedRows.map((row, idx) => (
            <motion.div
              key={row.week}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.03 }}
             onClick={() => {
  setSelectedWeek(row);
  
  const weekStart = parseDateString(row.startDate);
  const targetDate = new Date(weekStart);
  
  // Adjust to Monday: 
  // 0 is Sunday, 1 is Monday, 2 is Tuesday, etc.
  const day = targetDate.getDay();
  if (day === 0) {
    // If it's Sunday, Monday is the next day
    targetDate.setDate(targetDate.getDate() + 1);
  } else if (day !== 1) {
    // If it's after Monday, go back to the Monday of this week
    targetDate.setDate(targetDate.getDate() - (day - 1));
  }

  setSelectedDayDetail({ day: targetDate.getDate(), month: targetDate.getMonth(), year: targetDate.getFullYear() });
  setIsDetailModalOpen(true);
}}
              className={`group cursor-pointer grid grid-cols-[1fr_2fr] md:grid-cols-[1fr_2fr_2fr] items-center px-4 md:px-8 py-3.5
                transition-all duration-300
                hover:bg-white/50
                ${row.isCurrent
                  ? 'bg-gradient-to-r from-[#58334a]/[0.06] via-white/30 to-white/20'
                  : 'bg-white/10'
                }`}
            >
              {/* Week number */}
              <span className={`font-body text-[13px] md:text-[15px] font-bold ${row.isBreak ? 'text-slate-300' : 'text-slate-900 group-hover:text-[#58334a] transition-colors'}`}>
                {row.week.toString().padStart(2, '0')}
              </span>

              {/* Intake Dates / Unit Code (Combined for mobile) */}
              <div className="flex flex-col gap-1">
                <span className={`font-body text-[12px] md:text-[14px] font-bold ${row.isBreak ? 'text-slate-400' : 'text-slate-900'}`}>
                  {row.startDate} - {row.endDate}
                </span>
                <span className="md:hidden text-[11px] font-bold text-slate-500 truncate">
                  {row.isBreak ? 'Institutional Recess' : row.intakeCode}
                </span>
                {row.isCurrent && (
                  <div className="flex items-center gap-2 mt-1">
                    <div className="relative flex items-center justify-center w-2.5 h-2.5">
                      <div className="absolute inset-0 rounded-full border border-emerald-500/40" />
                      <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
                    </div>
                    <span className="text-[8px] font-bold text-emerald-600 uppercase tracking-widest">Active</span>
                  </div>
                )}
              </div>

              {/* Unit Code (Desktop only) */}
              <span className={`hidden md:block font-body text-[15px] font-bold ${row.isBreak ? 'text-slate-300' : 'text-slate-900'}`}>
                {row.isBreak ? 'Institutional Recess' : row.intakeCode}
              </span>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

  if (authLoading) {
    return (
      <div className="h-screen bg-[#f0ede8] flex items-center justify-center overflow-hidden">
        <div className="flex flex-col items-center gap-6">
          <div className="w-16 h-16 bg-[#58334a] rounded-2xl flex items-center justify-center shadow-2xl animate-pulse">
            <Cpu className="text-white w-8 h-8" />
          </div>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-[0.3em] animate-pulse">Initializing Portal...</p>
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

  // Only add admin panel if user is admin
  if (isAdmin) {
    menuItems.push({ id: 'admin', icon: ShieldCheck, label: 'Admin Panel' });
  }

  const renderSettings = () => {
    const containerVariants = {
      hidden: { opacity: 0, y: 10 },
      show: {
        opacity: 1,
        y: 0,
        transition: {
          staggerChildren: 0.1,
          delayChildren: 0.1,
          duration: 0.6,
          ease: [0.16, 1, 0.3, 1]
        }
      }
    };

    const itemVariants = {
      hidden: { opacity: 0, y: 20 },
      show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } }
    };

    return (
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="max-w-5xl space-y-10 pb-20"
      >


        <div className="grid grid-cols-1 gap-10">
          <motion.div variants={itemVariants} className="space-y-10 mt-[10px] md:mt-[30px]">
            <div className="bg-white rounded-[2rem] md:rounded-[4rem] border border-white shadow-[0_40px_80px_-20px_rgba(0,0,0,0.06),0_0_1px_rgba(0,0,0,0.1)] p-6 md:p-[40px] transition-all hover:shadow-[0_48px_96px_-24px_rgba(0,0,0,0.08)]">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-10 md:mb-14 gap-6">
                <h3 className="text-[22px] md:text-[30px] font-bold text-slate-900 font-sans tracking-tight leading-none">Profile</h3>
                {!isEditingProfile ? (
                  <motion.button 
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setIsEditingProfile(true)}
                    className="flex items-center gap-2.5 px-6 py-3 bg-[#58334a]/5 text-[#58334a] rounded-xl text-[13px] md:text-[14px] font-bold font-sans transition-all tracking-widest border border-[#58334a]/10 hover:bg-[#58334a]/10 w-full sm:w-auto justify-center"
                  >
                    <Edit2 size={16} />
                    Modify Record
                  </motion.button>
                ) : (
                  <div className="flex items-center gap-4 w-full sm:w-auto">
                    <button 
                      onClick={() => setIsEditingProfile(false)}
                      className="px-6 py-3 text-[11px] font-bold text-slate-400 hover:text-red-500 uppercase tracking-widest transition-colors flex-1 sm:flex-none"
                    >
                      Abort
                    </button>
                    <motion.button 
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleUpdateProfile}
                      disabled={isUpdating}
                      className="flex items-center gap-2.5 px-6 py-3 bg-[#58334a] text-white rounded-xl text-[11px] font-bold transition-all uppercase tracking-widest shadow-lg shadow-purple-900/20 disabled:opacity-30 flex-1 sm:flex-none justify-center"
                    >
                      {isUpdating ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                      Sync Identity
                    </motion.button>
                  </div>
                ) }
              </div>

              <div className="space-y-10 md:space-y-14">
                <div className="flex flex-col md:flex-row items-center md:items-start gap-8 md:gap-12 text-center md:text-left">
                  <div className="relative group/photo">
                    <div className="w-26 md:w-28 h-26 md:h-28 rounded-full bg-slate-50 border-2 border-slate-100 flex items-center justify-center overflow-hidden transition-all shadow-[inset_0_2px_4px_rgba(0,0,0,0.05)] group-hover/photo:border-[#58334a]/30 group-hover/photo:shadow-xl transition-all duration-500">
                      {userData?.photoURL || user.photoURL ? (
                        <img src={userData?.photoURL || user.photoURL} alt="Avatar" className="w-full h-full object-cover transition-transform duration-700 group-hover/photo:scale-110" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-white text-[#58334a] font-bold text-4xl md:text-5xl font-sans uppercase group-hover/photo:scale-110 transition-transform duration-700">
                          {user.displayName?.charAt(0) || 'U'}
                        </div>
                      )}
                    </div>
                    <motion.button 
                      whileHover={{ scale: 1.1, y: -2 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => photoInputRef.current?.click()}
                      className="absolute bottom-0 right-0 w-11 md:w-12 h-11 md:h-12 bg-slate-900 text-white rounded-full flex items-center justify-center shadow-[0_10px_25px_-5px_rgba(0,0,0,0.3)] hover:bg-[#58334a] transition-all z-10 border-[4px] border-white focus:outline-none"
                    >
                      <Camera size={18} />
                    </motion.button>
                    <input type="file" ref={photoInputRef} className="hidden" accept="image/*" onChange={handlePhotoUpload} />
                  </div>
                  
                  <div className="flex-1 space-y-3 md:space-y-4 md:pt-2">
                    <p className="text-[12px] md:text-[14px] font-bold text-slate-400 uppercase tracking-[0.25em] opacity-80 md:pl-1 font-sans">Institutional Identity</p>
                    {isEditingProfile ? (
                      <input 
                        type="text" 
                        value={editName} 
                        onChange={(e) => setEditName(e.target.value)}
                        className="w-full bg-transparent border-b-2 border-[#58334a]/20 py-2 text-2xl md:text-3xl font-bold text-slate-900 focus:outline-none focus:border-[#58334a] transition-all font-sans text-center md:text-left"
                        placeholder="Legal Full Name"
                      />
                    ) : (
                      <h4 className="text-[22px] md:text-[30px] font-bold text-slate-900 tracking-tight font-sans leading-tight">{user.displayName || 'Authorized User'}</h4>
                    )}
                    <div className="flex items-center justify-center md:justify-start gap-3 pt-1">
                      <span className="relative flex h-2.5 w-2.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                      </span>
                      <span className="text-[12px] md:text-[14px] font-bold text-emerald-600 uppercase tracking-widest opacity-90 font-sans">Verified Student Credentials</span>
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-12 border-t border-slate-50">
                  <div className="space-y-4">
                    <p className="text-[14px] font-bold text-slate-400 uppercase tracking-[0.2em] opacity-80 pl-2 font-sans">Network Address</p>
                    <div className="flex items-center gap-5 text-slate-900 font-bold bg-slate-50/50 p-6 rounded-[2rem] border border-slate-100/80 transition-all hover:bg-white hover:shadow-xl hover:shadow-slate-200/50 hover:border-white">
                      <div className="w-11 h-11 rounded-2xl bg-white flex items-center justify-center shadow-sm border border-slate-100">
                        <Mail size={18} className="text-[#58334a]" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[14px] text-slate-400  tracking-widest font-sans mb-0.5">Primary Email</span>
                        <span className="text-[15px] font-bold font-sans truncate max-w-[200px]">{user.email}</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <p className="text-[14px] font-bold text-slate-400 uppercase tracking-[0.2em] opacity-80 pl-2 font-sans">Intake Date</p>
                    <div className="flex items-center gap-5 text-slate-900 font-bold bg-slate-50/50 p-6 rounded-[2rem] border border-slate-100/80 transition-all hover:bg-white hover:shadow-xl hover:shadow-slate-200/50 hover:border-white">
                      <div className="w-11 h-11 rounded-2xl bg-white flex items-center justify-center shadow-sm border border-slate-100">
                        <Calendar size={18} className="text-[#58334a]" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[14px] text-slate-400  tracking-widest font-sans mb-0.5">Academic Entry</span>
                        <span className="text-[15px] font-bold font-sans">{selectedIntake.date || 'Pending Assignment'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <p className="text-[14px] font-bold text-slate-400 uppercase tracking-[0.2em] opacity-80 pl-2 font-sans">Telecommunication</p>
                    {isEditingProfile ? (
                      <div className="flex items-center gap-5 bg-white border-2 border-[#58334a]/20 p-6 rounded-[2rem] shadow-2xl shadow-purple-900/5 transition-all focus-within:border-[#58334a]/40">
                        <div className="w-11 h-11 rounded-2xl bg-[#58334a]/5 flex items-center justify-center">
                          <Phone size={18} className="text-[#58334a]" />
                        </div>
                        <div className="flex flex-col flex-1">
                          <span className="text-[10px] text-[#58334a] uppercase tracking-widest font-sans mb-0.5">Edit Contact</span>
                          <input 
                            type="tel"
                            value={editPhone}
                            onChange={(e) => setEditPhone(e.target.value)}
                            className="bg-transparent border-none outline-none font-bold text-slate-900 w-full text-[15px] p-0 h-auto font-sans placeholder:text-slate-300"
                            placeholder="+61 400 000 000"
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-5 text-slate-900 font-bold bg-slate-50/50 p-6 rounded-[2rem] border border-slate-100/80 transition-all hover:bg-white hover:shadow-xl hover:shadow-slate-200/50 hover:border-white">
                        <div className="w-11 h-11 rounded-2xl bg-white flex items-center justify-center shadow-sm border border-slate-100">
                          <Phone size={18} className="text-[#58334a]" />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[14px] text-slate-400  tracking-widest font-sans mb-0.5">Primary Contact</span>
                          <span className="text-[15px] font-bold font-sans">{userData?.phone || 'Not provided'}</span>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="space-y-4">
                    <p className="text-[14px] font-bold text-slate-400 uppercase tracking-[0.2em] opacity-80 pl-2 font-sans">Security Integrity</p>
                    <div className="flex items-center gap-5 text-[#58334a] font-bold bg-[#58334a]/5 p-6 rounded-[2rem] border border-[#58334a]/10">
                      <div className="w-11 h-11 rounded-2xl bg-white/50 flex items-center justify-center border border-[#58334a]/10">
                        <ShieldCheck size={18} />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[14px] text-[#58334a]/60  tracking-widest font-sans mb-0.5">Authentication Status</span>
                        <span className="text-[11px] font-bold font-sans uppercase tracking-[0.15em]">End-to-End Encrypted</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-16 pt-10 border-t border-slate-50">
                <motion.button 
                  whileHover={{ scale: 1.01, y: -2 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={async () => {
                    try {
                      await sendPasswordResetEmail(auth, user.email!);
                      alert("A secure reset link has been dispatched to your institutional inbox.");
                    } catch (e) {
                      console.error("Failed to send reset email.", e);
                    }
                  }}
                  className="w-full py-6 bg-white border border-slate-100 text-[#58334a] hover:bg-slate-50 rounded-[2rem] font-bold text-[14px] uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-4 shadow-sm hover:shadow-2xl hover:shadow-purple-900/10 font-sans"
                >
                  <ArrowRight size={18} />
                  <span>Request Credential Reset Sequence</span>
                </motion.button>
              </div>
            </div>
          </motion.div>
        </div>
      </motion.div>
    );
  };



  const renderCoursesDashboard = () => {
    if (selectedCourseId) {
  const activeCourse = filteredCourses.find(c => c.id === selectedCourseId);
  if (!activeCourse) {
    setSelectedCourseId(null);
    return null;
  }

  const intakeName = uploadedData && selectedCourseId && uploadedData[selectedCourseId]
    ? uploadedData[selectedCourseId][selectedUploadedIntake]?.name ?? ''
    : selectedIntake?.date ?? '';

  // Improved week detection
  let totalWeeks = 0;
  
  // 1. Try to find weeks in the intake/sheet name
  const weekRegex = /(\d+)\s*([Ww]eek|[Ww])/i;
  const weekMatch = intakeName.match(weekRegex);
  if (weekMatch) {
    totalWeeks = parseInt(weekMatch[1]);
  } else {
    // 2. Look across ALL sheets for this course to find a global week count
    if (uploadedData && selectedCourseId && uploadedData[selectedCourseId]) {
      for (const sheet of uploadedData[selectedCourseId]) {
        const sm = sheet.name.match(weekRegex);
        if (sm) {
          totalWeeks = parseInt(sm[1]);
          break;
        }
      }
    }
    
    if (totalWeeks === 0 || totalWeeks < 10) { // If still 0 or suspicious (less than 10)
      // 3. Try to find weeks in the course description or name
      const courseMatch = (activeCourse.name + ' ' + activeCourse.desc).match(weekRegex);
      if (courseMatch) {
        totalWeeks = parseInt(courseMatch[1]);
      } else {
        // 4. Fallback to data analysis
        const maxWeekInData = timetable.length > 0 ? Math.max(...timetable.map(r => r.week)) : 0;
        // Most common durations are 26, 52, 78, 104
        if (maxWeekInData > 0) {
          totalWeeks = maxWeekInData;
        } else if (timetable.length > 0) {
          totalWeeks = timetable.length;
        } else {
          totalWeeks = 52; // Absolute default
        }
      }
    }
  }

  return (
    <div className="space-y-[16px] md:space-y-[24px] mt-[8px] md:mt-[24px] w-full">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-center justify-between gap-5 md:gap-[24px] border-b border-[#ebe9e4] pb-5 md:pb-[24px]"
      >
        {/* Study Weeks Stat — replaces redundant course title */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="relative rounded-[20px] overflow-hidden border border-white/50 bg-white/40 backdrop-blur-[40px] shadow-[0_8px_32px_-8px_rgba(88,51,74,0.10),inset_0_1px_2px_0_rgba(255,255,255,0.9)] px-4 md:px-5 py-3.5 flex items-center gap-3 md:gap-4"
        >
          <motion.div
            animate={{ x: ['-100%', '300%'] }}
            transition={{ duration: 12, repeat: Infinity, ease: "easeInOut", repeatDelay: 8 }}
            className="absolute inset-0 pointer-events-none bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-[-35deg] z-10 opacity-50"
          />
          <div className="w-9 h-9 rounded-xl bg-[#58334a] flex items-center justify-center shadow-lg shadow-purple-900/15 flex-shrink-0 relative z-20">
            <Calendar className="text-white w-3.5 h-3.5" />
          </div>
          <div className="relative z-20">
            <p className="text-[11px] font-bold font-sans uppercase tracking-[0.25em] text-slate-800 mb-0.5">Study Duration</p>
            <p className="text-[18px] font-bold font-sans text-slate-900 leading-none">
              {totalWeeks} <span className="text-[12px] font-bold font-sans text-slate-600 uppercase tracking-widest ml-1">Weeks</span>
            </p>
          </div>
        </motion.div>

        {/* Right: Export Only */}
        <div className="flex items-center gap-4 md:gap-5">
          <button
            onClick={handleCapture}
            disabled={isCapturing}
            className="w-full sm:w-auto px-6 py-3.5 bg-[#58334a] text-white rounded-2xl font-medium text-[10px] uppercase tracking-[0.2em] shadow-xl shadow-purple-900/15 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
          >
            {isCapturing ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
            <span>Secure Export</span>
          </button>
        </div>
      </motion.div>

      <div className="">
        {renderTimeline()}
      </div>
    </div>
  );
}

    const containerVariants = {
      hidden: { opacity: 0 },
      show: {
        opacity: 1,
        transition: {
          staggerChildren: 0.08,
          delayChildren: 0.1
        }
      }
    };

    const cardVariants = {
      hidden: { opacity: 0, y: 30 },
      show: { 
        opacity: 1, 
        y: 0,
        transition: { 
          duration: 0.8, 
          ease: [0.16, 1, 0.3, 1] 
        } 
      }
    };

    return (
      <div className="space-y-6 w-full flex flex-col items-start p-0 md:p-[10px]">
        <motion.div 
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.05 }}
          variants={containerVariants}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 w-full mt-[20px] md:mt-[30px]"
        >
          {filteredCourses.map((course) => {
            // Calculate weeks from uploaded data if available
            const uploads = uploadedData?.[course.id];
            const weeksList = uploads && uploads.length > 0 
              ? uploads.map(u => {
                  const m = u.name.match(/(\d+)\s*[Ww]eeks?/i);
                  return m ? parseInt(m[1]) : u.rows.length;
                })
              : null;
            
            const durationDisplay = weeksList 
              ? (weeksList.length === 1 || Math.min(...weeksList) === Math.max(...weeksList)
                  ? `${weeksList[0]} Weeks` 
                  : `${Math.min(...weeksList)}-${Math.max(...weeksList)} Weeks`)
              : null;

            return (
              <motion.button
                key={course.id}
                variants={cardVariants}
                whileHover={{ y: -4, scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                onClick={() => setSelectedCourseId(course.id)}
                className="group relative flex flex-col text-left p-5 md:p-6 rounded-[1.5rem] bg-white/20 backdrop-blur-3xl border border-white/40 shadow-[0_16px_32px_-8px_rgba(0,0,0,0.08),inset_0_1px_2px_rgba(255,255,255,0.8)] hover:shadow-[0_24px_48px_-12px_rgba(88,51,74,0.12)] hover:border-[#58334a]/30 transition-all overflow-hidden h-full"
              >
                {/* Dynamic Border Animation */}
                <motion.div
                  animate={{
                    rotate: [0, 360],
                  }}
                  transition={{
                    duration: 8,
                    repeat: Infinity,
                    ease: "linear"
                  }}
                  className="absolute inset-[-100%] bg-gradient-to-r from-transparent via-[#58334a]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity blur-2xl z-0"
                />
                
                <div className="relative z-10 flex flex-col h-full">
                  <div className="flex items-start justify-between mb-6">
                    <div className="w-12 h-12 rounded-xl bg-white/40 backdrop-blur-md border border-white flex items-center justify-center group-hover:scale-110 group-hover:bg-white group-hover:shadow-lg transition-all shadow-sm">
                      <course.icon className="text-[#58334a] transition-colors" size={24} />
                    </div>
                    {durationDisplay && (
                      <div className="px-3 py-1 bg-[#58334a]/10 border border-[#58334a]/10 rounded-full text-[10px] font-bold text-[#58334a] uppercase tracking-widest">
                        {durationDisplay}
                      </div>
                    )}
                  </div>
                  <h3 className="text-[16px] md:text-[20px] font-bold font-sans text-slate-900 mb-4 tracking-[0.3px] leading-tight group-hover:text-[#58334a] transition-colors min-h-[44px] md:min-h-[52px] flex items-center">{course.name}</h3>
                  <p className="text-slate-700 text-[11px] md:text-[13px] font-bold font-secondary leading-relaxed mb-4 flex-grow group-hover:text-slate-900 transition-colors drop-shadow-sm">{course.desc}</p>
                  <div className="mt-auto flex items-center gap-2 text-[12px] md:text-[11px] font-bold font-sans uppercase tracking-[0.2em] text-[#58334a] group-hover:gap-3 transition-all">
                    <span>Access Materials</span>
                    <ArrowRight size={14} />
                  </div>
                </div>
              </motion.button>
            );
          })}
        </motion.div>
      </div>
    );
  };

  const renderContent = () => {
    if (activeTab === 'dashboard') {
      return renderCoursesDashboard();
    }
    if (activeTab === 'lms') {
      return (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center min-h-[60vh] text-center p-12 max-w-2xl"
        >
          <motion.div 
            whileHover={{ scale: 1.1, rotate: 5 }}
            className="w-24 h-24 bg-white rounded-[2rem] border border-[#ebe9e4] shadow-xl shadow-purple-900/5 flex items-center justify-center mb-10 transition-all cursor-pointer"
          >
            <Layout size={40} className="text-[#58334a]" />
          </motion.div>
          <h2 className="text-4xl font-bold tracking-[0.5px] text-slate-900 mb-5">LMS Dashboard</h2>
          <p className="text-slate-500 font-bold text-base leading-relaxed mb-12 opacity-70">Access your digital course materials, assignments, and learning resources through our LMS infrastructure.</p>
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-10 py-5 bg-[#58334a] text-white rounded-2xl font-medium text-xs uppercase tracking-[0.2em] shadow-2xl shadow-purple-900/20 transition-all"
          >
            Launch LMS Portal
          </motion.button>
        </motion.div>
      );
    }
    if (activeTab === 'settings') {
      return renderSettings();
    }
    if (activeTab === 'moodle') {
      return (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center min-h-[60vh] text-center p-12 max-w-2xl"
        >
          <motion.div 
            whileHover={{ scale: 1.1, rotate: -5 }}
            className="w-24 h-24 bg-white rounded-[2rem] border border-[#ebe9e4] shadow-xl shadow-purple-900/5 flex items-center justify-center mb-10 transition-all cursor-pointer"
          >
            <BookOpen size={40} className="text-[#58334a]" />
          </motion.div>
          <h2 className="text-4xl font-bold tracking-[0.5px] text-slate-900 mb-5">Student Dashboard</h2>
          <p className="text-slate-500 font-bold text-base leading-relaxed mb-12 opacity-70">Access your student records, digital transcripts, and enrollment status through our centralized management system.</p>
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-10 py-5 bg-[#58334a] text-white rounded-2xl font-medium text-xs uppercase tracking-[0.2em] shadow-2xl shadow-purple-900/20 transition-all"
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
          className="flex flex-col items-center justify-center min-h-[60vh] text-center p-12 max-w-2xl"
        >
          <motion.div 
            whileHover={{ scale: 1.1, y: -5 }}
            className="w-24 h-24 bg-white rounded-[2rem] border border-[#ebe9e4] shadow-xl shadow-purple-900/5 flex items-center justify-center mb-10 transition-all cursor-pointer"
          >
            <Mail size={40} className="text-[#b36688]" />
          </motion.div>
          <h2 className="text-4xl font-bold tracking-[0.5px] text-slate-900 mb-5">College Mailbox</h2>
          <p className="text-slate-500 font-bold text-base leading-relaxed mb-12 opacity-70">Stay connected with faculty members and peers via your institutional email account provided by The College.</p>
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-10 py-5 border-[2px] border-[#58334a] text-[#58334a] hover:bg-[#58334a] hover:text-white rounded-2xl font-medium text-xs uppercase tracking-[0.2em] shadow-xl shadow-purple-900/10 transition-all"
          >
            Proceed to Inbox
          </motion.button>
        </motion.div>
      );
    }

    if (activeTab === 'admin') {
      const containerVariants = {
        hidden: { opacity: 0 },
        show: {
          opacity: 1,
          transition: {
            staggerChildren: 0.1
          }
        }
      };

      const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } }
      };

      if (!isAdmin) {
        return (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center min-h-[60vh] text-center p-12 max-w-2xl"
          >
            <div className="w-24 h-24 bg-red-50 rounded-[2rem] border border-red-100 flex items-center justify-center mb-10">
              <ShieldAlert size={40} className="text-red-500" />
            </div>
            <h2 className="text-4xl font-bold tracking-[0.5px] text-slate-900 mb-5">Unauthorized Access</h2>
            <p className="text-slate-500 font-bold text-base leading-relaxed opacity-70">This terminal is restricted to institutional administrators. Your access attempt has been logged.</p>
          </motion.div>
        );
      }

      return (
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="max-w-6xl space-y-12 pb-12"
        >
          <motion.div variants={itemVariants} className="flex flex-col md:flex-row items-end justify-between gap-8">
            <div className="space-y-4 w-full">
              <div className="flex items-center gap-3">
                <motion.div 
                  whileHover={{ rotate: 360 }}
                  transition={{ duration: 1 }}
                  className="w-12 h-12 bg-[#58334a]/10 rounded-2xl flex items-center justify-center border border-[#58334a]/20"
                >
                  <ShieldCheck className="text-[#58334a]" size={24} />
                </motion.div>
                <h2 className="text-4xl md:text-5xl font-bold tracking-[0.5px]">Institutional Command</h2>
              </div>
              <p className="text-slate-500 font-bold max-w-xl opacity-70">Configuration terminal for institutional records and master timetable nodes.</p>
            </div>
            
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => fileInputRef.current?.click()}
              className="px-8 py-5 bg-[#58334a] text-white rounded-2xl font-medium text-xs uppercase tracking-[0.2em] flex items-center gap-4 shadow-2xl shadow-purple-900/20 transition-all"
            >
              <Upload size={18} />
              Update Master Ledger
            </motion.button>
            <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept=".xlsx, .xls" className="hidden" />

            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => studentRegistryInputRef.current?.click()}
              className="px-8 py-5 bg-white border border-[#58334a]/20 text-[#58334a] rounded-2xl font-medium text-xs uppercase tracking-[0.2em] flex items-center gap-4 shadow-xl transition-all hover:bg-[#58334a]/5"
            >
              <Users size={18} />
              Enrol Students
            </motion.button>
            <input type="file" ref={studentRegistryInputRef} onChange={handleStudentRegistryUpload} accept=".xlsx, .xls" className="hidden" />
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            <motion.div variants={itemVariants} className="lg:col-span-2 p-12 rounded-[3rem] bg-white border border-[#ebe9e4] shadow-sm">
              <h3 className="text-xl font-semibold tracking-[0.5px] mb-10 flex items-center gap-4">
                <Layout size={20} className="text-[#58334a]" />
                Authorized Data Repository
              </h3>
              
              {!uploadedData ? (
                <div className="space-y-6">
                  <div className="flex items-center justify-between border-b border-slate-800/10 pb-4">
                    <div className="flex items-center gap-3">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                      <h4 className="font-bold uppercase tracking-widest text-[11px] text-slate-400">Institutional System Files</h4>
                    </div>
                  </div>
                  {showMasterLedger ? (
                    <motion.div 
                      whileHover={{ scale: 1.01 }}
                      exit={{ opacity: 0, x: -20 }}
                      className={`p-8 rounded-[2rem] border flex items-center justify-between bg-slate-50 border-slate-100 group transition-all hover:bg-white hover:shadow-xl hover:border-[#58334a]/10`}
                    >
                      <div className="flex items-center gap-6">
                        <div className="w-14 h-14 rounded-2xl bg-[#58334a]/5 flex items-center justify-center group-hover:bg-[#58334a]/10 transition-colors">
                          <BookOpen className="text-[#58334a]" size={24} />
                        </div>
                        <div>
                          <p className="text-[17px] font-bold text-slate-900 leading-tight">Master_Institutional_Ledger_2026.xlsx</p>
                          <div className="flex items-center gap-3 mt-1.5">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Active System File</span>
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-200" />
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">1.4 MB</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <button 
                          onClick={() => {
                            setSelectedCourseId(COURSES[0].id);
                            setActiveTab('dashboard');
                          }}
                          className="px-6 py-3 bg-[#58334a] text-white rounded-xl text-[11px] font-bold uppercase tracking-[0.15em] hover:bg-[#48283a] transition-all shadow-lg shadow-purple-900/10"
                        >
                          Launch
                        </button>
                        <button 
                          className="p-3 text-red-500 hover:bg-red-50 rounded-xl transition-all"
                          onClick={() => setShowMasterLedger(false)}
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </motion.div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-10 opacity-40">
                      <Trash2 size={40} className="mb-4 text-slate-300" />
                      <p className="font-bold">No system files currently active.</p>
                      <button 
                        onClick={() => setShowMasterLedger(true)}
                        className="mt-4 text-[11px] font-bold uppercase tracking-widest text-[#58334a] hover:underline"
                      >
                        Restore Base Ledger
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-8">
                  {Object.entries(uploadedData).map(([courseId, intakes]) => {
                    const courseIntakes = intakes as { name: string, rows: TimetableRow[] }[];
                    const course = COURSES.find(c => c.id === courseId);
                    return (
                      <div key={courseId} className="space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-800/10 pb-4">
                          <div className="flex items-center gap-3">
                            <span className={`w-3 h-3 rounded-full ${course?.color || 'bg-slate-500'}`} />
                            <h4 className="font-bold uppercase tracking-widest text-sm">{course?.name || 'Unassigned Sheets'}</h4>
                          </div>
                          <span className="text-[10px] font-bold uppercase opacity-30 tracking-[0.2em]">{courseIntakes.length} Intakes Detected</span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {courseIntakes.map((intake, i) => (
                            <motion.div 
                              key={i} 
                              whileHover={{ scale: 1.02 }}
                              className={`p-5 rounded-2xl border flex items-center justify-between ${isLightMode ? 'bg-slate-50 border-slate-100' : 'bg-slate-800/40 border-slate-700/50'}`}
                            >
                              <p className="text-xs font-bold truncate max-w-[150px]">{intake.name}</p>
                              <div className="flex items-center gap-2">
                                <button 
                                  onClick={() => {
                                    setSelectedCourseId(courseId === 'unassigned' ? COURSES[0].id : courseId);
                                    setSelectedUploadedIntake(i);
                                    setActiveTab('dashboard');
                                  }}
                                  className="p-2 hover:bg-indigo-500/10 rounded-lg transition-all text-indigo-400"
                                >
                                  <ArrowRight size={16} />
                                </button>
                                <button 
                                  onClick={() => {
                                    const newData = { ...uploadedData };
                                    const courseArr = [...newData[courseId]];
                                    courseArr.splice(i, 1);
                                    if (courseArr.length === 0) {
                                      delete newData[courseId];
                                    } else {
                                      newData[courseId] = courseArr;
                                    }
                                    setUploadedData(Object.keys(newData).length === 0 ? null : newData);
                                  }}
                                  className="p-2 hover:bg-red-500/10 rounded-lg transition-all text-red-400"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                  
                  <motion.button 
                    whileHover={{ backgroundColor: '#fee2e2' }}
                    onClick={() => setUploadedData(null)}
                    className="w-full py-4 border border-red-500/20 text-red-400 font-bold uppercase text-[10px] tracking-widest rounded-2xl transition-all"
                  >
                    Clear All Cached Data
                  </motion.button>
                </div>
              )}
            </motion.div>

            <motion.div variants={itemVariants} className="space-y-8">
              {/* Student Enrollment Card */}
              <div className={`p-8 rounded-[2.5rem] border ${isLightMode ? 'bg-[#58334a] text-white' : 'bg-slate-900 border-slate-800'}`}>
                <h3 className="text-[11px] font-bold tracking-[0.3em] uppercase mb-8 opacity-60 flex items-center gap-3">
                  <Users size={16} className="text-white/40" />
                  Student Enrollment
                </h3>
                
                {!studentRegistry ? (
                  <div className="space-y-6">
                    <div className="p-8 rounded-[2rem] border border-white/10 bg-white/5 flex flex-col items-center text-center">
                      <Database size={32} className="text-white/20 mb-4" />
                      <p className="text-[10px] font-bold text-white/40 mb-6 uppercase tracking-widest">Registry Empty</p>
                      <button 
                        onClick={() => studentRegistryInputRef.current?.click()}
                        className="w-full py-4 bg-white text-[#58334a] rounded-2xl text-[11px] font-bold uppercase tracking-widest hover:bg-white/90 transition-all font-sans"
                      >
                        Import Students
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="bg-black/20 p-2 rounded-xl flex items-center justify-between px-4">
                      <span className="text-[9px] font-bold uppercase tracking-widest opacity-60">Verified Records</span>
                      <span className="text-[9px] font-bold bg-white/20 px-2 py-0.5 rounded-full">{studentRegistry.length}</span>
                    </div>
                    <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                      {studentRegistry.map((s, idx) => (
                        <div key={idx} className="p-4 rounded-xl bg-white/5 border border-white/10 flex flex-col gap-2 relative">
                          <div className="flex items-start justify-between">
                            <div className="min-w-0">
                              <p className="text-[12px] font-bold truncate text-white">{s.name}</p>
                              <p className="text-[10px] opacity-70 truncate text-white/80">{s.email}</p>
                            </div>
                            <button 
                              onClick={async () => {
                                const newList = [...studentRegistry];
                                newList.splice(idx, 1);
                                setStudentRegistry(newList.length === 0 ? null : newList);
                                // Sync to Firestore
                                try {
                                  const registryRef = doc(db, 'system', 'studentRegistry');
                                  await setDoc(registryRef, { data: newList.length === 0 ? [] : newList, updatedAt: serverTimestamp() });
                                } catch (err) { console.error(err); }
                              }}
                              className="p-2 text-white/30 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                          <div className="grid grid-cols-2 gap-2 mt-1">
                            <div className="text-[9px] font-bold opacity-40 uppercase tracking-widest text-[#b36688] truncate">{s.qualification}</div>
                            <div className="text-[9px] font-bold opacity-60 uppercase tracking-widest text-emerald-400 text-right">Intake: {s.intakeDate}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <button 
                      onClick={() => setStudentRegistry(null)}
                      className="w-full py-3 border border-white/10 text-white/40 rounded-xl text-[9px] font-bold uppercase tracking-widest hover:text-white hover:bg-white/5 transition-all"
                    >
                      Clear Registry
                    </button>
                  </div>
                )}
              </div>

              <div className={`p-8 rounded-[2.5rem] border ${isLightMode ? 'bg-white border-slate-200' : 'bg-slate-900/40 border-slate-800'}`}>
                <h3 className="text-sm font-bold tracking-widest uppercase mb-6 opacity-40">System Status</h3>
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-body font-bold opacity-60">Auth Engine</p>
                    <span className="px-2 py-1 bg-emerald-500/10 text-emerald-500 text-[10px] font-sans font-bold rounded-lg">OPERATIONAL</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-body font-bold opacity-60">Storage Sync</p>
                    <span className="px-2 py-1 bg-emerald-500/10 text-emerald-500 text-[10px] font-sans font-bold rounded-lg">OPERATIONAL</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-body font-bold opacity-60">Data Latency</p>
                    <span className="text-xs font-sans font-bold">14ms</span>
                  </div>
                </div>
              </div>

              <div className={`p-8 rounded-[2.5rem] border bg-gradient-to-br from-indigo-600 to-violet-700 text-white shadow-2xl shadow-indigo-600/20 relative overflow-hidden group`}>
                <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-[0.03] transition-opacity duration-700" />
                <Settings className="mb-6 opacity-50 transition-transform duration-700 group-hover:rotate-90" size={32} />
                <h3 className="text-lg font-semibold tracking-[0.5px] mb-2 uppercase">Bulk Maintenance</h3>
                <p className="text-xs font-bold opacity-80 leading-relaxed mb-6">Need to update all courses at once? Our intelligent parser detects groups across multiple sheets automatically.</p>
                <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest opacity-60">
                   <div className="w-1 h-1 rounded-full bg-white animate-pulse" />
                   AI Assisted Parsing Active
                </div>
              </div>
            </motion.div>
          </div>
        </motion.div>
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

      {/* Week Detail Modal */}
      <AnimatePresence>
        {isDetailModalOpen && selectedWeek && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center sm:p-6 md:p-12 overflow-hidden font-body">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsDetailModalOpen(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 30 }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className="relative w-full max-w-5xl h-full max-h-[85vh] flex flex-col md:flex-row shadow-[0_80px_150px_-30px_rgba(0,0,0,0.4)] rounded-[3.5rem] overflow-hidden bg-white/95 lg:bg-white/90 backdrop-blur-[100px] border border-white/40"
            >
              {/* Left Side - Calendar Grid View */}
              <div className="flex-1 p-8 md:p-12 overflow-y-auto custom-scrollbar">
                <div className="flex items-center justify-between mb-10 min-h-[80px]">
                  <div className="flex items-center gap-10">
                    <h2 className="text-[32px] font-sans font-bold tracking-[0.1px] leading-none flex items-baseline select-none text-slate-900">
                      {(() => {
                         const start = parseDateString(selectedWeek.startDate);
                         const end = parseDateString(selectedWeek.endDate);
                         return `${start.getDate()} - ${end.getDate()}`;
                      })()}
                      <span className="text-[24px] font-sans font-bold ml-4 text-slate-600">
                        {(() => {
                           const d = parseDateString(selectedWeek.startDate);
                           const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                           return months[d.getMonth()];
                        })()}
                      </span>
                    </h2>
                    
                    <div className="h-12 w-[2px] bg-slate-200 hidden md:block" />
                    
                    <div className="flex flex-col">
                      <p className="text-[14px] font-sans font-bold uppercase tracking-[0.3em] text-[#58334a] leading-none mb-1.5 opacity-80">Schedule</p>
                      <p className="text-[30px] font-sans font-bold tracking-[0.5px] text-slate-900 uppercase leading-none">Week {selectedWeek.week.toString().padStart(2, '0')}</p>
                    </div>
                  </div>
                  
                  <button 
                    onClick={() => setIsDetailModalOpen(false)}
                    className="p-4 hover:bg-slate-100 rounded-full transition-all group"
                  >
                    <X size={24} className="opacity-30 group-hover:opacity-100 transition-all" />
                  </button>
                </div>
{/* Weekday Labels — full week */}
                {/* Weekday Labels — full week */}
                <div className="grid grid-cols-7 gap-4 mb-4">
                  {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map(day => (
                    <div key={day} className={`text-center text-[14px] font-bold tracking-[0.3em] ${day === 'SAT' || day === 'SUN' ? 'text-slate-400' : 'text-slate-500'}`}>{day}</div>
                  ))}
                </div>

                {/* Calendar Days Grid — full week shown, Sat/Sun greyed, classes only Mon–Fri */}
                <div className="grid grid-cols-7 gap-4 md:gap-5">
                  {(() => {
                    // For this week, pick 2 or 3 class days (Mon–Fri only), stable per week number
                    const classCountOptions = [2, 3, 2, 3, 3, 2, 3, 2, 2, 3];
                    const classCount = classCountOptions[(selectedWeek.week - 1) % classCountOptions.length];
                    const dayPickOptions: Record<number, number[]> = {
                      2: [[1,3],[2,4],[1,4],[2,5],[3,5],[1,5]][( selectedWeek.week - 1) % 6],
                      3: [[1,3,5],[2,4,5],[1,2,4],[1,3,4],[2,3,5],[1,2,5]][(selectedWeek.week - 1) % 6],
                    };
                    const classDays: number[] = (dayPickOptions as any)[classCount] || [1,3];

                    return getCalendarDays(parseDateString(selectedWeek.startDate)).map((dayObj, idx) => {
                    const currentDay = new Date(dayObj.year, dayObj.month, dayObj.day);
                    const weekStart = parseDateString(selectedWeek.startDate);
                    const weekEnd = parseDateString(selectedWeek.endDate);
                    const isInWeek = currentDay >= weekStart && currentDay <= weekEnd;
                    const dayOfWeek = currentDay.getDay(); // 0=Sun, 6=Sat
                    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
                    // A "class day" = inside the week range + is one of the picked Mon–Fri days
                    const isClassDay = isInWeek && !isWeekend && classDays.includes(dayOfWeek);
                    const isToday = currentDay.toDateString() === new Date().toDateString();
                    const isSelected = selectedDayDetail?.day === dayObj.day && selectedDayDetail?.month === dayObj.month && selectedDayDetail?.year === dayObj.year;

                    return (
                      <button
                        key={idx}
                        disabled={!dayObj.isCurrentMonth}
                        onClick={() => dayObj.isCurrentMonth && setSelectedDayDetail({ day: dayObj.day, month: dayObj.month, year: dayObj.year })}
                        className={`aspect-square rounded-[1.5rem] p-4 flex flex-col items-center justify-center relative transition-all duration-300 group/day ${
                          !dayObj.isCurrentMonth
                            ? 'opacity-5 cursor-default'
                            : isWeekend
                            ? 'opacity-60 cursor-not-allowed bg-slate-50/50 border border-slate-100'
                            : isSelected
                            ? 'bg-[#58334a] text-white shadow-2xl scale-105 z-10'
                            : isClassDay
                            ? 'bg-[#58334a]/10 text-[#58334a] hover:bg-[#58334a]/20 cursor-pointer'
                            : 'bg-[#f7f6f3] border border-[#ebe9e4] hover:bg-white hover:border-[#58334a]/30 cursor-pointer'
                        } ${isToday && !isSelected ? 'ring-2 ring-[#58334a]' : ''} active:scale-95`}
                      >
                        <span className={`text-xl md:text-2xl font-bold ${
                          isSelected ? 'text-white' :
                          isWeekend ? 'text-slate-400' :
                          isClassDay ? 'text-[#58334a]' : 'text-slate-900'
                        }`}>
                          {dayObj.day}
                        </span>
                        {/* Class dot indicator */}
                        {isClassDay && !isSelected && (
                          <div className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-[#58334a]/40" />
                        )}
                        {/* Small "class" label on class days */}
                        {isClassDay && !isSelected && (
                          <span className="text-[7px] font-bold uppercase tracking-widest text-[#58334a]/50 mt-0.5">Class</span>
                        )}
                      </button>
                    );
                  })
                })()}
              </div>
            </div>
              {/* Right Side - Information Panel */}
              <div className="w-full md:w-[420px] p-8 md:p-12 border-t md:border-t-0 md:border-l bg-[#f7f6f3] border-[#ebe9e4] flex flex-col relative overflow-y-auto custom-scrollbar">
                <div className="space-y-12">
                  <div className="min-h-[80px] flex flex-col justify-center">
                   <p className="text-[18px] font-bold tracking-[0.3em] text-[#58334a]">
  {selectedDayDetail ? 'Weekly Session Details' : 'Weekly Session Details'}
</p>
                    <div className="h-0.5 w-16 bg-[#58334a]/60 rounded-full mt-3" />
                  </div>

                  <div className="space-y-6">
 {(() => {
  const DEMO_TRAINERS = ['Demo', 'Demo'];
  const DEMO_TIMES = [
    '08:30 AM - 04:30 PM',
    '09:00 AM - 05:00 PM',
    '08:00 AM - 04:00 PM',
    '09:30 AM - 05:30 PM',
    '08:30 AM - 03:30 PM',
  ];
  const demoTime = DEMO_TIMES[(selectedWeek.week - 1) % DEMO_TIMES.length];
  const demoTrainer = DEMO_TRAINERS[(selectedWeek.week - 1) % DEMO_TRAINERS.length];

  // Logic to determine if we should show "No Classes Today"
  let isNoClassToday = false;
  let isWeekendStatus = false;
  
  if (selectedDayDetail) {
    const d = new Date(selectedDayDetail.year, selectedDayDetail.month, selectedDayDetail.day);
    const dayOfWeek = d.getDay();
    isWeekendStatus = dayOfWeek === 0 || dayOfWeek === 6;
    
    const classCountOptions = [2, 3, 2, 3, 3, 2, 3, 2, 2, 3];
    const classCount = classCountOptions[(selectedWeek.week - 1) % classCountOptions.length];
    const dayPickOptions: Record<number, number[]> = {
      2: [[1,3],[2,4],[1,4],[2,5],[3,5],[1,5]][(selectedWeek.week - 1) % 6],
      3: [[1,3,5],[2,4,5],[1,2,4],[1,3,4],[2,3,5],[1,2,5]][(selectedWeek.week - 1) % 6],
    };
    const classDays: number[] = (dayPickOptions as any)[classCount] || [1,3];
    const isClassDay = !isWeekendStatus && classDays.includes(dayOfWeek);
    
    if (isWeekendStatus || !isClassDay) {
      isNoClassToday = true;
    }
  }

  return (
    <div className="space-y-6">
      {(() => {
        if (isNoClassToday) {
          return (
            <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
              <div className="w-24 h-24 rounded-[3rem] bg-white flex items-center justify-center mb-8 border border-white shadow-md">
                <Coffee size={40} className="text-[#58334a]/20" />
              </div>
              <h3 className="text-2xl font-bold text-slate-800 tracking-tight mb-2">No Classes Today</h3>
              <p className="text-slate-500 font-bold mb-10 max-w-[240px] text-[11px] leading-relaxed uppercase tracking-[0.2em]">
                {isWeekendStatus ? 'Scheduled Weekend Break' : 'Non-Teaching Academic Day'}
              </p>
            </div>
          );
        }

        return (
          <div className="space-y-6">
            {/* Unit Card */}
            <div className="p-[35px] rounded-[3rem] bg-white border border-white/60 shadow-sm relative group">
              <div className="flex justify-between items-start mb-4">
                <p className="text-[16px] font-bold tracking-[0.15em] text-slate-500">Unit of Competency Code</p>
                <Globe size={22} className="text-slate-400 group-hover:text-[#58334a] transition-colors" />
              </div>
              <p className="text-[22px] font-bold text-[#58334a] tracking-[-0.02em] leading-tight uppercase">{selectedWeek.intakeCode}</p>
            </div>

            {/* Schedule Card */}
            <div className="p-[25px] rounded-[3rem] bg-white border border-white/60 shadow-sm relative group">
              <div className="flex justify-between items-start mb-4">
                <p className="text-[16px] font-bold tracking-[0.15em] text-slate-500">Schedule Time Period</p>
                <Calendar size={22} className="text-slate-400 group-hover:text-[#58334a] transition-colors" />
              </div>
              <p className="text-[22px] font-bold text-slate-800 tracking-[-0.02em] leading-tight">{selectedWeek.time || demoTime}</p>
            </div>

            {/* Faculty Card */}
            <div className="p-[25px] rounded-[3rem] bg-white border border-white/60 shadow-sm relative group">
              <div className="flex justify-between items-start mb-4">
                <p className="text-[16px] font-bold tracking-[0.15em] text-slate-500">Trainers</p>
                <UserIcon size={22} className="text-slate-400 group-hover:text-[#58334a] transition-colors" />
              </div>
              <p className="text-[22px] font-bold text-slate-800 tracking-[-0.02em] leading-tight">{selectedWeek.trainers || demoTrainer}</p>
            </div>


          </div>
        );
      })()}

      {/* Download Button */}
      {!isNoClassToday && (
        <div className="pt-6">
          <button
            onClick={async () => {
              const doc = new jsPDF();
              const demoTimeVal = DEMO_TIMES[(selectedWeek.week - 1) % DEMO_TIMES.length];
              const demoTrainerVal = DEMO_TRAINERS[(selectedWeek.week - 1) % DEMO_TRAINERS.length];
              doc.setFontSize(16);
              doc.setTextColor(44, 62, 80);
              doc.text(`Week ${selectedWeek.week} - Session Detail`, 105, 15, { align: 'center' });
              autoTable(doc, {
                startY: 25,
                head: [['Field', 'Detail']],
                body: [
                  ['Unit Code', selectedWeek.intakeCode],
                  ['Date Range', `${selectedWeek.startDate} - ${selectedWeek.endDate}`],
                  ['Schedule', selectedWeek.time || demoTimeVal],
                  ['Faculty', selectedWeek.trainers || demoTrainerVal],
                ],
                theme: 'grid',
                headStyles: { fillColor: [88, 51, 74], textColor: [255, 255, 255], fontSize: 10, fontStyle: 'bold' },
                styles: { fontSize: 10, cellPadding: 5 },
              });
              doc.save(`Week_${selectedWeek.week}_${selectedWeek.startDate}.pdf`);
            }}
            className="w-full py-6 rounded-[2rem] bg-[#58334a] text-white text-[14px] font-bold uppercase tracking-[0.2em] flex items-center justify-center gap-4 shadow-2xl shadow-purple-900/30 hover:bg-[#6b3f5a] transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <Download size={18} />
            Download Week {selectedWeek.week}
          </button>
        </div>
      )}
    </div>
  );
})()}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Mobile Header Bar */}
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

      {/* Mobile Sidebar Overlay */}
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

      {/* Main Sidebar */}
      <motion.aside 
        initial={{ x: -280, opacity: 0 }}
        animate={{ 
          x: (isMobileMenuOpen || window.innerWidth >= 1024) ? 0 : -280, 
          opacity: 1 
        }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className={`fixed lg:flex w-full lg:w-[20%] h-screen left-0 top-0 bg-white/95 lg:bg-white/10 backdrop-blur-[80px] border-r border-white/20 z-[80] flex flex-col py-6 lg:py-10 px-5 lg:px-8 shadow-[20px_0_40px_-15px_rgba(0,0,0,0.05)] overflow-y-auto overflow-x-hidden custom-scrollbar ${isMobileMenuOpen ? 'flex animate-in slide-in-from-left duration-500' : 'hidden lg:flex'}`}
      >
        {/* Glass sweep animation - sidebar */}
        <motion.div
          animate={{
            x: ['-100%', '300%'],
          }}
          transition={{
            duration: 12,
            repeat: Infinity,
            ease: "easeInOut",
            repeatDelay: 3
          }}
          className="absolute inset-0 pointer-events-none bg-gradient-to-r from-transparent via-white/10 to-transparent skew-x-[-35deg] z-0 opacity-40"
        />

        <div className="flex items-center gap-6 mb-12 px-2 relative z-10">
          <div className="w-16 h-16 bg-[#58334a] rounded-[1.5rem] flex items-center justify-center shadow-2xl shadow-purple-900/30 transition-transform hover:scale-105 duration-500 border border-white/20">
            <Cpu className="text-white w-9 h-9" />
          </div>
          <div className="flex flex-col">
            <span className="text-[21px] font-bold font-sans text-slate-900 tracking-tight leading-none mb-2 transition-colors group-hover:text-[#58334a]">The College</span>
            <span className="text-[16px] font-bold font-sans text-[#58334a] tracking-[0.2em] uppercase opacity-80">(Demo)</span>
          </div>
        </div>

        <motion.nav 
          variants={{
            show: {
              transition: {
                staggerChildren: 0.05
              }
            }
          }}
          initial="hidden"
          animate="show"
          className="flex-1 space-y-2 relative z-10"
        >
          {menuItems.map((item) => (
              <motion.button
                key={item.id}
                variants={{
                  hidden: { x: -20, opacity: 0 },
                  show: { x: 0, opacity: 1 }
                }}
                whileHover={{ x: 4 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  setActiveTab(item.id as any);
                  if (item.id === 'dashboard') setSelectedCourseId(null);
                  setIsMobileMenuOpen(false);
                }}
                className={`w-full flex items-center gap-4 px-5 py-3.5 rounded-[18px] font-sans font-bold text-[14px] tracking-tight transition-all group ${
                  activeTab === item.id 
                    ? 'bg-[#58334a] text-white shadow-xl shadow-purple-900/15' 
                    : 'text-slate-500 hover:bg-[#f7f6f3] hover:text-[#58334a]'
                }`}
              >
              <item.icon className={`w-5 h-5 transition-colors ${activeTab === item.id ? 'text-white' : 'text-slate-400 group-hover:text-[#58334a]'}`} />
              {item.label}
            </motion.button>
          ))}
        </motion.nav>

        <div className="mt-auto pt-8 border-t border-slate-100/40 relative z-10">
          <div className="bg-white/30 backdrop-blur-2xl rounded-[20px] p-4 border border-white/40 shadow-[0_12px_24px_-8px_rgba(0,0,0,0.05),inset_0_1px_1px_rgba(255,255,255,0.5)]">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-white/60 backdrop-blur-md border border-white flex items-center justify-center overflow-hidden flex-shrink-0 shadow-sm">
                {userData?.photoURL || user.photoURL ? (
                  <img src={userData?.photoURL || user.photoURL} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="font-bold text-[#58334a] text-sm uppercase">{user.displayName?.charAt(0) || 'U'}</div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[14px] font-bold font-sans text-slate-900 truncate uppercase tracking-tight leading-none drop-shadow-sm">
                  {user.displayName?.split(' ')?.[0] || 'Student'}
                </p>
                {(() => {
                  const reg = studentRegistry?.find(s => s.email.toLowerCase() === user?.email?.toLowerCase());
                  if (reg) {
                    return (
                      <p className="text-[9px] font-bold text-[#58334a] uppercase tracking-widest mt-1 opacity-60 truncate">
                        {reg.qualification}
                      </p>
                    );
                  }
                  return null;
                })()}
              </div>
            </div>
            <button 
              onClick={() => signOut(auth)}
              className="w-full py-2.5 bg-white/50 backdrop-blur-md border border-white text-slate-600 hover:text-red-600 hover:bg-red-50/50 rounded-xl text-[12px] font-bold font-sans uppercase tracking-[0.1em] transition-all flex items-center justify-center gap-3 shadow-[0_4px_8px_-2px_rgba(0,0,0,0.02),inset_0_1px_1px_rgba(255,255,255,0.8)] hover:shadow-lg hover:shadow-red-900/5"
            >
              <LogOut size={14} />
              Sign Out
            </button>
          </div>
        </div>
      </motion.aside>

      {/* Main Content Area */}
        
      <motion.main 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 0.2 }}
        className="flex-1 lg:ml-[20%] px-4 lg:px-6 py-16 lg:py-6 h-screen overflow-y-auto relative z-10 flex flex-col items-start w-full lg:w-[80%] custom-scrollbar"
      >


          {/* RTO and CRICOS Badge — above header */}
<div className="w-full flex justify-end mb-2">
  <div className="hidden md:flex items-center gap-4 bg-white/10 backdrop-blur-[80px] px-5 py-2.5 rounded-2xl border border-white/20 shadow-[20px_0_40px_-15px_rgba(0,0,0,0.05),inset_0_1px_2px_0_rgba(255,255,255,0.4)]">
    <div className="flex flex-center gap-2">
      <span className="text-[12px] font-bold font-sans text-[#58334a] tracking-[0.2em] uppercase">RTO:</span>
      <span className="text-[12px] font-bold text-slate-800 tabular-nums">Demo</span>
    </div>
    <div className="w-px h-3 bg-[#58334a]/10" />
    <div className="flex items-center gap-2">
      <span className="text-[12px] font-bold font-sans text-[#58334a] tracking-[0.2em] uppercase">CRICOS:</span>
      <span className="text-[12px] font-bold text-slate-800 tabular-nums">Demo</span>
    </div>
  </div>
</div>
     
        <header className={`w-full flex flex-col md:flex-row md:items-center justify-start md:justify-between gap-6 mb-2 text-left relative overflow-hidden p-5 md:p-6 rounded-[1.5rem] bg-[#58334a]/[0.02] border border-[#58334a]/5 shadow-[inset_0_1px_2px_rgba(255,255,255,0.8)] ${(activeTab === 'dashboard' && !selectedCourseId) ? 'min-h-[280px]' : 'min-h-[190px]'}`}>
         
        
         
         
          {/* Branded Banner Background */}
          <div className="absolute inset-0 z-[1] opacity-50 pointer-events-none">
            <img 
              src="https://tan-occasional-flamingo-688.mypinata.cloud/ipfs/bafybeiftrwk66i2xev4rrotd4ss6sr2tykflx5vxuljrasdc5satuukria" 
              alt="" 
              className="w-full h-full object-cover scale-110 blur-[1px]"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[#f0ede8] via-transparent to-[#f0ede8]" />
          </div>

         

          <div className="space-y-4 relative z-10">
            <div className="flex flex-col">
              <h1 className="course-heading text-slate-900 leading-tight">
  {activeTab === 'dashboard' ? (selectedCourseId ? (filteredCourses.find(c => c.id === selectedCourseId)?.name || 'Schedule Explorer') : 'Academic Timetable') : 
   activeTab === 'lms' ? 'LMS Dashboard' : 
   activeTab === 'moodle' ? 'SMS Dashboard' : 
   activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
</h1>
{activeTab === 'dashboard' && selectedCourseId && (
<p className="course-desc text-slate-900 mt-2 font-bold leading-relaxed">
    {filteredCourses.find(c => c.id === selectedCourseId)?.desc}
  </p>
)}       </div>
           
          </div>
        </header>

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

      {/* Profile Image Crop Modal */}
      <AnimatePresence>
        {isCropModalOpen && imageToCrop && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-[500px] overflow-hidden border border-white flex flex-col"
            >
              <div className="p-8 border-b border-slate-100">
                <h3 className="text-2xl font-bold font-sans text-slate-900 tracking-tight flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#58334a]/5 flex items-center justify-center">
                    <Camera className="text-[#58334a]" size={20} />
                  </div>
                  Adjust Profile Image
                </h3>
              </div>

              <div className="relative h-[350px] bg-slate-50 w-full">
                <Cropper
                  image={imageToCrop}
                  crop={crop}
                  zoom={zoom}
                  aspect={1}
                  onCropChange={setCrop}
                  onCropComplete={onCropComplete}
                  onZoomChange={setZoom}
                  cropShape="round"
                  showGrid={false}
                />
              </div>

              <div className="p-8 space-y-8">
                <div className="space-y-4">
                  <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest text-slate-400">
                    <span>Zoom Level</span>
                    <span className="text-[#58334a]">{Math.round(zoom * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    value={zoom}
                    min={1}
                    max={3}
                    step={0.1}
                    aria-labelledby="Zoom"
                    onChange={(e) => setZoom(Number(e.target.value))}
                    className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-[#58334a]"
                  />
                </div>

                <div className="flex gap-4">
                  <button
                    onClick={() => setIsCropModalOpen(false)}
                    className="flex-1 py-4.5 rounded-2xl bg-slate-50 text-slate-600 text-[15px] font-bold font-sans uppercase tracking-[0.1em] transition-all hover:bg-slate-100"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleApplyCrop}
                    className="flex-3 py-4.5 rounded-2xl bg-[#58334a] text-white text-[15px] font-bold font-sans uppercase tracking-[0.1em] transition-all shadow-lg shadow-purple-900/20 hover:shadow-xl hover:shadow-purple-900/30 flex items-center justify-center gap-3"
                  >
                    Apply & Save
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <style dangerouslySetInnerHTML={{ __html: `
        body { background-color: #f0ede8; }
        .custom-scrollbar::-webkit-scrollbar { width: 5px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #ebe9e4; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #58334a33; }
      `}} />
    </div>
  );
};

export default App;
