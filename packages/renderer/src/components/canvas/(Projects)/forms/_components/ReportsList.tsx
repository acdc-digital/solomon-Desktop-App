// REPORTS LIST 
// /Users/matthewsimon/Documents/Github/solomon-Desktop-App/packages/renderer/src/components/canvas/(Projects)/forms/_components/ReportsList.tsx

'use client';

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  PlusIcon, 
  SearchIcon, 
  CalendarIcon, 
  FileTextIcon,
  ChevronRightIcon
} from "lucide-react";
import { Report } from "@/lib/store/formsStore";

interface ReportsListProps {
  reports: Report[];
  onSelectReport: (reportId: string) => void;
  onCreateNewReport: () => void;
}

const ReportsList: React.FC<ReportsListProps> = ({ 
  reports, 
  onSelectReport, 
  onCreateNewReport 
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  
  // Filter reports based on search query
  const filteredReports = reports.filter(report => 
    report.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    report.projectNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
    report.type.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Project Reports</h1>
        
        <Button onClick={onCreateNewReport} className="flex items-center gap-2">
          <PlusIcon className="h-4 w-4" />
          <span>New Report</span>
        </Button>
      </div>
      
      {/* Search Bar */}
      <div className="relative mb-6">
        <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Search reports..."
          className="pl-10"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>
      
      {/* Reports List */}
      <div className="border rounded-md overflow-hidden">
        {filteredReports.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center text-gray-500">
            <FileTextIcon className="h-12 w-12 text-gray-300 mb-4" />
            {searchQuery ? (
              <>
                <p>No reports match your search.</p>
                <p className="text-sm mt-1">Try with different keywords.</p>
              </>
            ) : (
              <>
                <p>No reports have been created yet.</p>
                <p className="text-sm mt-1">Click "New Report" to get started.</p>
              </>
            )}
          </div>
        ) : (
          <div className="divide-y">
            {filteredReports.map((report) => (
              <div 
                key={report.id} 
                className="flex items-center justify-between p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                onClick={() => onSelectReport(report.id)}
              >
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-medium text-gray-800 truncate">{report.title}</h3>
                  <div className="flex items-center gap-4 mt-1">
                    <span className="inline-flex items-center text-sm text-gray-500">
                      <FileTextIcon className="h-3.5 w-3.5 mr-1" />
                      {report.type}
                    </span>
                    <span className="inline-flex items-center text-sm text-gray-500">
                      #{report.projectNumber}
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="text-sm text-gray-500 whitespace-nowrap">
                    <CalendarIcon className="inline h-3.5 w-3.5 mr-1" />
                    {report.date}
                  </div>
                  <ChevronRightIcon className="h-5 w-5 text-gray-400" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ReportsList;