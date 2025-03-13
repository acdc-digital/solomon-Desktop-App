// /lib/store/formsStore.tsx
// /Users/matthewsimon/Documents/Github/solomon-Desktop-App/packages/renderer/src/lib/store/formsStore.tsx

// /lib/store/formsStore.tsx

import { create } from 'zustand';

// Define the project data interface
export interface ProjectData {
  title: string;
  projectNumber: string;
  date: string;
  customer: {
    name: string;
    address: string;
    contact: string;
    phone: string;
    email: string;
  };
  location: string;
  architect: string;
  generalContractor: string;
  contractAmount: string;
  poNumber: string;
  startDate: string;
  estimatedCompletion: string;
  currentPhase: string;
  progressPercentage: number;
  photos: {
    id: string;
    caption: string;
    date: string;
    url: string;
  }[];
  notes: string;
  [key: string]: any;
}

// Define the report interface
export interface Report {
  id: string;
  title: string;
  projectNumber: string;
  date: string;
  type: string;
}

// Sample report data for development
const sampleReports: Report[] = [
  {
    id: "report-1",
    title: "Commercial Building Renovation",
    projectNumber: "PRJ-2025-001",
    date: "March 12, 2025",
    type: "Progress Report"
  },
  {
    id: "report-2",
    title: "Downtown Office Complex",
    projectNumber: "PRJ-2025-002",
    date: "March 5, 2025",
    type: "Initial Assessment"
  },
  {
    id: "report-3",
    title: "Riverside Apartment Development",
    projectNumber: "PRJ-2024-156",
    date: "February 28, 2025",
    type: "Final Report"
  }
];

// Sample report data mapping (would be replaced by Convex queries in production)
const sampleReportsData: Record<string, ProjectData> = {
  "report-1": {
    title: "Commercial Building Renovation",
    projectNumber: "PRJ-2025-001",
    date: "March 12, 2025",
    customer: {
      name: "Acme Corporation",
      address: "123 Business Ave, Suite 500, San Francisco, CA 94107",
      contact: "Jane Smith",
      phone: "(415) 555-1234",
      email: "jane.smith@acmecorp.com"
    },
    location: "456 Market Street, San Francisco, CA 94105",
    architect: "Modern Designs Studio",
    generalContractor: "BuildRight Construction, Inc.",
    contractAmount: "$1,450,000.00",
    poNumber: "PO-2025-0342",
    startDate: "January 15, 2025",
    estimatedCompletion: "September 30, 2025",
    currentPhase: "Foundation & Structural",
    progressPercentage: 28,
    photos: [
      { id: "photo1", caption: "Site preparation", date: "January 20, 2025", url: "/api/placeholder/400/300" },
      { id: "photo2", caption: "Foundation excavation", date: "February 5, 2025", url: "/api/placeholder/400/300" },
      { id: "photo3", caption: "Steel frame installation", date: "February 28, 2025", url: "/api/placeholder/400/300" },
      { id: "photo4", caption: "Support beam placement", date: "March 10, 2025", url: "/api/placeholder/400/300" },
    ],
    notes: "Project currently on schedule. Weather delays in February were mitigated by additional crew assignments. Material deliveries are arriving as planned."
  },
  "report-2": {
    title: "Downtown Office Complex",
    projectNumber: "PRJ-2025-002",
    date: "March 5, 2025",
    customer: {
      name: "TechFirm Innovations",
      address: "789 Tech Blvd, Floor 12, San Francisco, CA 94103",
      contact: "Michael Johnson",
      phone: "(415) 555-7890",
      email: "michael.johnson@techfirm.com"
    },
    location: "1010 Innovation Way, San Francisco, CA 94105",
    architect: "Future Space Architects",
    generalContractor: "Precision Construction Group",
    contractAmount: "$2,750,000.00",
    poNumber: "PO-2025-0187",
    startDate: "February 1, 2025",
    estimatedCompletion: "November 15, 2025",
    currentPhase: "Initial Design & Planning",
    progressPercentage: 12,
    photos: [
      { id: "photo1", caption: "Site survey", date: "February 5, 2025", url: "/api/placeholder/400/300" },
      { id: "photo2", caption: "Initial measurements", date: "February 12, 2025", url: "/api/placeholder/400/300" },
    ],
    notes: "Project kickoff completed successfully. Initial designs have been approved by the client. Site survey revealed some potential challenges with the foundation that will require additional engineering assessments."
  },
  "report-3": {
    title: "Riverside Apartment Development",
    projectNumber: "PRJ-2024-156",
    date: "February 28, 2025",
    customer: {
      name: "Riverside Properties LLC",
      address: "555 Riverfront Avenue, San Francisco, CA 94111",
      contact: "Sarah Williams",
      phone: "(415) 555-3456",
      email: "sarah@riversideproperties.com"
    },
    location: "101 Riverside Drive, San Francisco, CA 94111",
    architect: "Urban Living Designs",
    generalContractor: "Elite Construction Partners",
    contractAmount: "$5,200,000.00",
    poNumber: "PO-2024-0891",
    startDate: "October 15, 2024",
    estimatedCompletion: "July 30, 2025",
    currentPhase: "Exterior Finishing",
    progressPercentage: 68,
    photos: [
      { id: "photo1", caption: "Building exterior - North side", date: "February 10, 2025", url: "/api/placeholder/400/300" },
      { id: "photo2", caption: "Window installation - Floors 1-3", date: "February 15, 2025", url: "/api/placeholder/400/300" },
      { id: "photo3", caption: "Balcony railings installation", date: "February 20, 2025", url: "/api/placeholder/400/300" },
      { id: "photo4", caption: "Exterior paint - South wing", date: "February 25, 2025", url: "/api/placeholder/400/300" },
    ],
    notes: "Project is ahead of schedule. Exterior work is progressing well despite occasional rain. Interior work is set to begin next week. Client has requested a change to the lobby design which is currently being evaluated."
  }
};

// Create a new report template
const createNewReportTemplate = (): ProjectData => ({
  title: "New Project Report",
  projectNumber: `PRJ-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`,
  date: new Date().toISOString().split('T')[0],
  customer: {
    name: "",
    address: "",
    contact: "",
    phone: "",
    email: ""
  },
  location: "",
  architect: "",
  generalContractor: "",
  contractAmount: "",
  poNumber: "",
  startDate: new Date().toISOString().split('T')[0],
  estimatedCompletion: new Date(new Date().setMonth(new Date().getMonth() + 6)).toISOString().split('T')[0],
  currentPhase: "Planning",
  progressPercentage: 0,
  photos: [],
  notes: ""
});

// Define the forms store state
interface FormsState {
  // Reports list
  reports: Report[];
  
  // Current view state
  selectedReportId: string | null;
  activeTab: 'preview' | 'edit';
  currentView: 'title' | 'details' | 'photos' | 'all';
  
  // Current report data
  currentReport: ProjectData | null;
  
  // Action creators
  setSelectedReportId: (id: string | null) => void;
  setActiveTab: (tab: 'preview' | 'edit') => void;
  setCurrentView: (view: 'title' | 'details' | 'photos' | 'all') => void;
  updateCurrentReport: (data: ProjectData) => void;
  createNewReport: () => void;
  
  // Data fetching/saving (these would integrate with Convex in production)
  fetchReportData: (id: string) => void;
  saveReportData: () => void;
}

// Create the forms store
export const useFormsStore = create<FormsState>((set, get) => ({
  // Initial state
  reports: sampleReports,
  selectedReportId: null,
  activeTab: 'preview',
  currentView: 'all',
  currentReport: null,
  
  // Action creators
  setSelectedReportId: (id) => {
    set({ selectedReportId: id });
    if (id) {
      get().fetchReportData(id);
    } else {
      set({ currentReport: null });
    }
  },
  
  setActiveTab: (tab) => set({ activeTab: tab }),
  
  setCurrentView: (view) => set({ currentView: view }),
  
  updateCurrentReport: (data) => {
    set({ currentReport: data });
    // In a real implementation, you might auto-save here 
    // or set a "hasChanges" flag
  },
  
  createNewReport: () => {
    const newReport: ProjectData = createNewReportTemplate();
    
    // In a real app, you would save this to your database first
    // For now, just set it as the current report
    set({ 
      currentReport: newReport,
      selectedReportId: 'new-report',
      activeTab: 'edit' 
    });
    
    // In production, you would add the new report to the reports list after saving
  },
  
  // Data fetching/saving (integrate with Convex in production)
  fetchReportData: (id) => {
    // In a real app, you would fetch this from your database
    // For demo purposes, we'll use our sample data
    console.log(`Fetching report data for ID: ${id}`);
    
    // Log the available report IDs for debugging
    console.log("Available report IDs:", Object.keys(sampleReportsData));
    
    const reportData = id === 'new-report' 
      ? createNewReportTemplate() 
      : sampleReportsData[id];
    
    // Log the actual data retrieved
    console.log("Report data retrieved:", reportData);
    
    if (reportData) {
      // Log before setting state
      console.log("Setting currentReport to:", reportData);
      set({ currentReport: reportData });
      
      // Log state after update
      console.log("Current store state after update:", get());
    } else {
      console.error(`Report with ID ${id} not found`);
      set({ currentReport: null, error: `Report with ID ${id} not found` });
    }
  },
  
  saveReportData: () => {
    const { currentReport, selectedReportId } = get();
    
    if (!currentReport || !selectedReportId) return;
    
    console.log(`Saving report data for ID: ${selectedReportId}`, currentReport);
    
    // In a real app, you would save this to your database
    // For demo purposes, we'll just log it
    
    // Example of how you might update the reports list
    if (selectedReportId === 'new-report') {
      // For a new report, you'd normally get an ID back from the database
      const newId = `report-${Date.now()}`;
      
      // Add to the reports list
      const newReportSummary: Report = {
        id: newId,
        title: currentReport.title,
        projectNumber: currentReport.projectNumber,
        date: currentReport.date,
        type: "Progress Report" // Default type
      };
      
      set({ 
        reports: [...get().reports, newReportSummary],
        selectedReportId: newId // Update the ID to the new one
      });
    } else {
      // Update existing report in the list
      const updatedReports = get().reports.map(report => 
        report.id === selectedReportId 
          ? { 
              ...report, 
              title: currentReport.title,
              date: currentReport.date
            }
          : report
      );
      
      set({ reports: updatedReports });
    }
    
    // Show success message, etc.
  }
}));

export default useFormsStore;