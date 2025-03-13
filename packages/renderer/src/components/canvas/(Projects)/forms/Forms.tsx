// FORMS
// /Users/matthewsimon/Documents/Github/solomon-Desktop-App/packages/renderer/src/components/canvas/(Projects)/forms/Forms.tsx

'use client';

import React, { useRef, useEffect, useState } from "react";
import { useFormsStore } from "@/lib/store/formsStore";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  PrinterIcon, 
  FileTextIcon, 
  ClipboardListIcon, 
  ImageIcon,
  EyeIcon, 
  PencilIcon, 
  ArrowLeftIcon 
} from "lucide-react";

// Import your components
import ReportsList from './_components/ReportsList';
import TitlePage from './_components/TitlePage';
import ProjectDetailsPage from './_components/ProjectDetails';
import PhotoReportPage from './_components/PhotoReport'; 
import FormEditor from './_components/FormEditor';

const Forms = () => {
  const { 
    reports,
    selectedReportId,
    activeTab,
    currentView,
    currentReport,
    setSelectedReportId,
    setActiveTab,
    setCurrentView,
    createNewReport,
    updateCurrentReport
  } = useFormsStore();
  
  const containerRef = useRef(null);
  const [containerHeight, setContainerHeight] = useState(800); // Default height
  
  // Measure container height on mount and resize
  useEffect(() => {
    const updateHeight = () => {
      const projectContainer = document.getElementById('project-container');
      if (projectContainer) {
        const tabHeight = 50;
        const availableHeight = projectContainer.clientHeight - tabHeight;
        setContainerHeight(availableHeight);
      } else {
        const windowHeight = window.innerHeight;
        const estimatedHeight = windowHeight - 100;
        setContainerHeight(estimatedHeight);
      }
    };
    
    updateHeight();
    window.addEventListener('resize', updateHeight);
    
    const observer = new MutationObserver(updateHeight);
    observer.observe(document.body, { 
      childList: true, 
      subtree: true,
      attributes: true 
    });
    
    return () => {
      window.removeEventListener('resize', updateHeight);
      observer.disconnect();
    };
  }, []);
  
  // Native browser print function
  const handlePrint = () => {
    // Create a new window for printing
    const printWindow = window.open('', '_blank', 'width=800,height=600');
    
    if (!printWindow) {
      alert("Please allow pop-ups for printing reports");
      return;
    }
    
    // Generate HTML content for printing
    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Project Report - ${currentReport.projectNumber}</title>
        <style>
          @page {
            size: letter;
            margin: 0;
          }
          body {
            margin: 0;
            padding: 0;
            font-family: Arial, sans-serif;
          }
          .page {
            width: 8.5in;
            height: 11in;
            padding: 0.5in;
            box-sizing: border-box;
            page-break-after: always;
            position: relative;
          }
          .page:last-child {
            page-break-after: auto;
          }
          .page-content {
            height: 100%;
          }
          .header {
            display: flex;
            justify-content: space-between;
            margin-bottom: 2rem;
          }
          .title {
            font-size: 2rem;
            font-weight: bold;
            margin-bottom: 1rem;
          }
          .subtitle {
            font-size: 1.2rem;
            color: #666;
            margin-bottom: 2rem;
          }
          .center-content {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            flex: 1;
            min-height: 50%;
          }
          .divider {
            width: 80px;
            height: 2px;
            background-color: #ddd;
            margin: 2rem 0;
          }
          .info-card {
            border: 1px solid #ddd;
            border-radius: 4px;
            padding: 1.5rem;
            margin-top: 2rem;
          }
          .info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 1rem;
          }
          .info-item h3 {
            font-size: 0.9rem;
            color: #666;
            margin-bottom: 0.25rem;
          }
          .info-item p {
            font-size: 1rem;
            margin: 0;
          }
          .section {
            margin-bottom: 1.5rem;
          }
          .section-title {
            font-size: 1.2rem;
            font-weight: bold;
            margin-bottom: 0.75rem;
            color: #333;
          }
          .progress-container {
            width: 100%;
            background-color: #eee;
            height: 8px;
            border-radius: 4px;
            margin-top: 0.5rem;
          }
          .progress-bar {
            height: 100%;
            background-color: #007bff;
            border-radius: 4px;
          }
          .photo-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 1rem;
          }
          .photo-item {
            border: 1px solid #ddd;
            border-radius: 4px;
            overflow: hidden;
          }
          .photo-caption {
            padding: 0.5rem;
            font-size: 0.9rem;
          }
          .photo-date {
            font-size: 0.8rem;
            color: #666;
          }
          .footer {
            position: absolute;
            bottom: 0.5in;
            left: 0.5in;
            right: 0.5in;
            text-align: center;
            font-size: 0.8rem;
            color: #666;
          }
        </style>
      </head>
      <body>
        <!-- Title Page -->
        <div class="page">
          <div class="page-content">
            <div class="header">
              <div>
                <h2>Solomon Project Management</h2>
                <p>Professional Project Reports</p>
              </div>
              <div style="text-align: right;">
                <p>Project #${currentReport.projectNumber}</p>
                <p>${currentReport.date}</p>
              </div>
            </div>
            
            <div class="center-content">
              <div class="divider"></div>
              <h1 class="title">${currentReport.title}</h1>
              <p class="subtitle">Progress Report</p>
              <div class="divider"></div>
            </div>
            
            <div class="info-card">
              <div class="info-grid">
                <div class="info-item">
                  <h3>Client</h3>
                  <p>${currentReport.customer.name}</p>
                </div>
                <div class="info-item">
                  <h3>Location</h3>
                  <p>${currentReport.location}</p>
                </div>
                <div class="info-item">
                  <h3>Architect</h3>
                  <p>${currentReport.architect}</p>
                </div>
                <div class="info-item">
                  <h3>General Contractor</h3>
                  <p>${currentReport.generalContractor}</p>
                </div>
              </div>
            </div>
            
            <div class="footer">
              <p>Report generated by Solomon Project Management System on ${currentReport.date}</p>
              <p>Page 1 of 3</p>
            </div>
          </div>
        </div>
        
        <!-- Details Page -->
        <div class="page">
          <div class="page-content">
            <div class="header">
              <h1>Project Details</h1>
              <div style="text-align: right;">
                <p>Project #${currentReport.projectNumber}</p>
                <p>${currentReport.date}</p>
              </div>
            </div>
            
            <h2>${currentReport.title}</h2>
            
            <div class="section">
              <div class="info-grid">
                <div class="info-card">
                  <h3 class="section-title">Client Information</h3>
                  <p style="font-weight: bold;">${currentReport.customer.name}</p>
                  <p>${currentReport.customer.address}</p>
                  <p>Contact: ${currentReport.customer.contact}</p>
                  <div style="margin-top: 0.5rem;">
                    <p>${currentReport.customer.phone}</p>
                    <p>${currentReport.customer.email}</p>
                  </div>
                </div>
                
                <div class="info-card">
                  <h3 class="section-title">Project Information</h3>
                  <div style="display: flex; justify-content: space-between; margin-bottom: 0.25rem;">
                    <span>Location:</span>
                    <span>${currentReport.location}</span>
                  </div>
                  <div style="display: flex; justify-content: space-between; margin-bottom: 0.25rem;">
                    <span>Architect:</span>
                    <span>${currentReport.architect}</span>
                  </div>
                  <div style="display: flex; justify-content: space-between; margin-bottom: 0.25rem;">
                    <span>General Contractor:</span>
                    <span>${currentReport.generalContractor}</span>
                  </div>
                  <div style="display: flex; justify-content: space-between; margin-bottom: 0.25rem;">
                    <span>Contract Amount:</span>
                    <span>${currentReport.contractAmount}</span>
                  </div>
                  <div style="display: flex; justify-content: space-between; margin-bottom: 0.25rem;">
                    <span>PO Number:</span>
                    <span>${currentReport.poNumber}</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div class="section">
              <h3 class="section-title">Project Timeline</h3>
              <div class="info-card">
                <div class="info-grid">
                  <div>
                    <p style="color: #666;">Start Date</p>
                    <p style="font-weight: bold;">${currentReport.startDate}</p>
                  </div>
                  <div>
                    <p style="color: #666;">Current Phase</p>
                    <p style="font-weight: bold;">${currentReport.currentPhase}</p>
                  </div>
                  <div>
                    <p style="color: #666;">Estimated Completion</p>
                    <p style="font-weight: bold;">${currentReport.estimatedCompletion}</p>
                  </div>
                </div>
                
                <div style="margin-top: 1rem;">
                  <div style="display: flex; justify-content: space-between;">
                    <p style="font-weight: bold;">Overall Progress</p>
                    <p style="font-weight: bold;">${currentReport.progressPercentage}%</p>
                  </div>
                  <div class="progress-container">
                    <div class="progress-bar" style="width: ${currentReport.progressPercentage}%;"></div>
                  </div>
                </div>
              </div>
            </div>
            
            <div class="section">
              <h3 class="section-title">Project Notes</h3>
              <div class="info-card">
                <p>${currentReport.notes}</p>
              </div>
            </div>
            
            <div class="footer">
              <p>Report generated by Solomon Project Management System on ${currentReport.date}</p>
              <p>Page 2 of 3</p>
            </div>
          </div>
        </div>
        
        <!-- Photo Page -->
        <div class="page">
          <div class="page-content">
            <div class="header">
              <h1>Photo Documentation</h1>
              <div style="text-align: right;">
                <p>Project #${currentReport.projectNumber}</p>
                <p>${currentReport.date}</p>
              </div>
            </div>
            
            <h2>${currentReport.title}</h2>
            
            <p style="margin-bottom: 1.5rem;">
              The following photographs document key progress milestones and current site conditions
              as of the report date. All photos are date-stamped and captioned for reference.
            </p>
            
            <div class="photo-grid">
              ${currentReport.photos.map(photo => `
                <div class="photo-item">
                  <div style="height: 150px; background-color: #eee; display: flex; align-items: center; justify-content: center;">
                    <span>[Photo: ${photo.caption}]</span>
                  </div>
                  <div class="photo-caption">
                    <div style="display: flex; justify-content: space-between;">
                      <p>${photo.caption}</p>
                      <p class="photo-date">${photo.date}</p>
                    </div>
                  </div>
                </div>
              `).join('')}
            </div>
            
            <div class="footer">
              <p>Report generated by Solomon Project Management System on ${currentReport.date}</p>
              <p>Page 3 of 3</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;
    
    // Write to the new window
    printWindow.document.open();
    printWindow.document.write(printContent);
    printWindow.document.close();
    
    // Wait for content to load then print
    printWindow.onload = function() {
      printWindow.print();
      // Close the window after printing (optional)
      // printWindow.onafterprint = function() {
      //   printWindow.close();
      // };
    };
  };
  
  const handleSelectReport = (reportId) => {
    console.log("Selecting report:", reportId);
    setSelectedReportId(reportId);
    setActiveTab('preview');
  };

  const handleBackToList = () => {
    setSelectedReportId(null);
  };
  
  const handleFormUpdate = (updatedReport) => {
    updateCurrentReport(updatedReport);
  };

  // Show reports list if no report selected
  if (!selectedReportId) {
    return (
      <div ref={containerRef} style={{ height: `${containerHeight}px`, overflow: 'auto' }}>
        <ReportsList 
          reports={reports}
          onSelectReport={handleSelectReport}
          onCreateNewReport={createNewReport}
        />
      </div>
    );
  }

  // Show loading if report is selected but data not loaded yet
  if (!currentReport) {
    return <div className="p-6 text-center">Loading report...</div>;
  }

  // Calculate content height
  const headerHeight = 65; // Top toolbar
  const subHeaderHeight = 60; // View selector
  const contentHeight = containerHeight - headerHeight - (activeTab === 'preview' ? subHeaderHeight : 0);

  return (
    <div ref={containerRef} style={{ height: `${containerHeight}px` }}>
      {/* Top toolbar with action buttons */}
      <div style={{ height: `${headerHeight}px` }} className="flex justify-between items-center p-4 border-b bg-white">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBackToList}
            className="flex items-center gap-1"
          >
            <ArrowLeftIcon className="h-4 w-4" />
            <span>Back to Reports</span>
          </Button>
          <div className="h-6 w-px bg-gray-200 mx-2"></div>
          <h1 className="text-xl font-semibold text-gray-800 truncate max-w-[400px]">
            {currentReport.title}
          </h1>
        </div>
        
        <div className="flex gap-2">
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v)} className="w-auto">
            <TabsList>
              <TabsTrigger value="preview" className="flex items-center gap-1">
                <EyeIcon className="h-4 w-4" />
                <span>Preview</span>
              </TabsTrigger>
              <TabsTrigger value="edit" className="flex items-center gap-1">
                <PencilIcon className="h-4 w-4" />
                <span>Edit</span>
              </TabsTrigger>
            </TabsList>
          </Tabs>
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handlePrint}
            className="ml-2 bg-white border-gray-200 text-gray-700 hover:bg-gray-50 flex items-center gap-1"
          >
            <PrinterIcon className="h-4 w-4" />
            <span>Print</span>
          </Button>
        </div>
      </div>

      {/* Content Area */}
      {activeTab === 'preview' && (
        <>
          {/* Report view selector */}
          <div style={{ height: `${subHeaderHeight}px` }} className="p-4 border-b bg-white">
            <div className="flex gap-2 overflow-x-auto pb-1">
              <Button 
                variant={currentView === "title" ? "default" : "outline"} 
                size="sm"
                onClick={() => setCurrentView("title")}
                className="flex items-center gap-1"
              >
                <FileTextIcon className="h-4 w-4" />
                <span>Title Page</span>
              </Button>
              <Button 
                variant={currentView === "details" ? "default" : "outline"} 
                size="sm"
                onClick={() => setCurrentView("details")}
                className="flex items-center gap-1"
              >
                <ClipboardListIcon className="h-4 w-4" />
                <span>Project Details</span>
              </Button>
              <Button 
                variant={currentView === "photos" ? "default" : "outline"} 
                size="sm"
                onClick={() => setCurrentView("photos")}
                className="flex items-center gap-1"
              >
                <ImageIcon className="h-4 w-4" />
                <span>Photo Report</span>
              </Button>
              <Button 
                variant={currentView === "all" ? "default" : "outline"} 
                size="sm"
                onClick={() => setCurrentView("all")}
              >
                <span>All Pages</span>
              </Button>
            </div>
          </div>
          
          {/* Scrollable content area */}
          <div 
            className="bg-gray-100"
            style={{ 
              height: `${contentHeight}px`, 
              overflowY: 'auto',
              paddingBottom: '20px'
            }}
          >
            {/* Visual preview */}
            <div className="p-4">
              <div className="flex flex-col gap-8 items-center pb-16">
                {(currentView === "title" || currentView === "all") && (
                  <div className="w-[8.5in] min-h-[11in] bg-white shadow-lg rounded-sm">
                    <TitlePage project={currentReport} />
                  </div>
                )}
                
                {(currentView === "details" || currentView === "all") && (
                  <div className="w-[8.5in] min-h-[11in] bg-white shadow-lg rounded-sm">
                    <ProjectDetailsPage project={currentReport} />
                  </div>
                )}
                
                {(currentView === "photos" || currentView === "all") && (
                  <div className="w-[8.5in] min-h-[11in] bg-white shadow-lg rounded-sm">
                    <PhotoReportPage project={currentReport} />
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}
      
      {/* Edit Mode */}
      {activeTab === 'edit' && (
        <div 
          className="bg-white"
          style={{ 
            height: `${contentHeight}px`, 
            overflowY: 'auto' 
          }}
        >
          <FormEditor 
            project={currentReport} 
            onUpdate={handleFormUpdate} 
          />
        </div>
      )}
    </div>
  );
};

export default Forms;