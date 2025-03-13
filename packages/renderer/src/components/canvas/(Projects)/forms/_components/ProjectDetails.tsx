// PROJECT DETAILS PAGE
// /Users/matthewsimon/Documents/Github/solomon-Desktop-App/packages/renderer/src/components/canvas/(Projects)/forms/_components/ProjectDetailsPage.tsx

'use client';

import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";

interface ProjectData {
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
  notes: string;
  [key: string]: any;
}

interface ProjectDetailsPageProps {
  project: ProjectData;
}

const ProjectDetailsPage: React.FC<ProjectDetailsPageProps> = ({ project }) => {
  return (
    <div className="w-full h-[11in] flex flex-col p-8 bg-white">
      {/* Page Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Project Details</h1>
        <div className="text-right">
          <p className="text-sm font-medium text-gray-600">Project #{project.projectNumber}</p>
          <p className="text-sm text-gray-500">{project.date}</p>
        </div>
      </div>
      
      <Separator className="mb-6" />
      
      {/* Project Identification Section */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-700 mb-3">{project.title}</h2>
        
        <div className="grid grid-cols-2 gap-6">
          <Card>
            <CardContent className="p-4">
              <h3 className="text-sm font-semibold text-gray-600 mb-2">Client Information</h3>
              <p className="text-base font-medium text-gray-800 mb-1">{project.customer.name}</p>
              <p className="text-sm text-gray-600 mb-1">{project.customer.address}</p>
              <p className="text-sm text-gray-600">Contact: {project.customer.contact}</p>
              <div className="flex flex-col mt-2 text-sm text-gray-600">
                <p>{project.customer.phone}</p>
                <p>{project.customer.email}</p>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <h3 className="text-sm font-semibold text-gray-600 mb-2">Project Information</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <p className="text-sm text-gray-600">Location:</p>
                  <p className="text-sm text-gray-800">{project.location}</p>
                </div>
                <div className="flex justify-between">
                  <p className="text-sm text-gray-600">Architect:</p>
                  <p className="text-sm text-gray-800">{project.architect}</p>
                </div>
                <div className="flex justify-between">
                  <p className="text-sm text-gray-600">General Contractor:</p>
                  <p className="text-sm text-gray-800">{project.generalContractor}</p>
                </div>
                <div className="flex justify-between">
                  <p className="text-sm text-gray-600">Contract Amount:</p>
                  <p className="text-sm text-gray-800">{project.contractAmount}</p>
                </div>
                <div className="flex justify-between">
                  <p className="text-sm text-gray-600">PO Number:</p>
                  <p className="text-sm text-gray-800">{project.poNumber}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      
      {/* Project Timeline Section */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-gray-700 mb-3">Project Timeline</h3>
        
        <Card>
          <CardContent className="p-4">
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div>
                <p className="text-sm text-gray-600 mb-1">Start Date</p>
                <p className="text-base font-medium text-gray-800">{project.startDate}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Current Phase</p>
                <p className="text-base font-medium text-gray-800">{project.currentPhase}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Estimated Completion</p>
                <p className="text-base font-medium text-gray-800">{project.estimatedCompletion}</p>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <p className="text-sm font-medium text-gray-700">Overall Progress</p>
                <p className="text-sm font-medium text-gray-700">{project.progressPercentage}%</p>
              </div>
              <Progress value={project.progressPercentage} className="h-2" />
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Project Notes Section */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-gray-700 mb-3">Project Notes</h3>
        
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-700 whitespace-pre-line">{project.notes}</p>
          </CardContent>
        </Card>
      </div>
      
      {/* Financial Summary Section - Placeholder for future implementation */}
      <div>
        <h3 className="text-lg font-semibold text-gray-700 mb-3">Financial Summary</h3>
        
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-500 text-center py-4">
              Financial details will be implemented in future iterations.
            </p>
          </CardContent>
        </Card>
      </div>
      
      {/* Footer */}
      <div className="mt-auto pt-4 text-xs text-gray-500 text-center">
        <p>Report generated by Solomon Project Management System on {project.date}</p>
        <p>Page 2 of 3</p>
      </div>
    </div>
  );
};

export default ProjectDetailsPage;