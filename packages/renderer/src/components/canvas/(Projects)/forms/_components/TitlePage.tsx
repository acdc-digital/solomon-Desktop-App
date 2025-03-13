// TITLE PAGE
// /Users/matthewsimon/Documents/Github/solomon-Desktop-App/packages/renderer/src/components/canvas/(Projects)/forms/_components/TitlePage.tsx

'use client';

import React from "react";
import { Card, CardContent } from "@/components/ui/card";

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
  [key: string]: any;
}

interface TitlePageProps {
  project: ProjectData;
}

const TitlePage: React.FC<TitlePageProps> = ({ project }) => {
  return (
    <div className="w-full h-[11in] flex flex-col p-8 bg-white">
      {/* Top Section - Logo and Project Number */}
      <div className="flex justify-between items-start mb-12">
        <div className="flex flex-col">
          <h2 className="text-xl font-semibold text-gray-600">Solomon Project Management</h2>
          <p className="text-sm text-gray-500">Professional Project Reports</p>
        </div>
        <div className="text-right">
          <p className="text-sm font-medium text-gray-600">Project #{project.projectNumber}</p>
          <p className="text-sm text-gray-500">{project.date}</p>
        </div>
      </div>

      {/* Middle Section - Title and Decorative Line */}
      <div className="flex-1 flex flex-col items-center justify-center">
        <div className="w-20 h-1 bg-gray-300 mb-8"></div>
        <h1 className="text-4xl font-bold text-gray-800 mb-2">{project.title}</h1>
        <p className="text-xl text-gray-600 mb-8">Progress Report</p>
        <div className="w-20 h-1 bg-gray-300 mt-8"></div>
      </div>

      {/* Bottom Section - Project Details Summary */}
      <div className="mt-auto">
        <Card className="border-gray-200 shadow-sm">
          <CardContent className="p-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm font-semibold text-gray-600 mb-1">Client</h3>
                <p className="text-base text-gray-800">{project.customer.name}</p>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-600 mb-1">Location</h3>
                <p className="text-base text-gray-800">{project.location}</p>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-600 mb-1">Architect</h3>
                <p className="text-base text-gray-800">{project.architect}</p>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-600 mb-1">General Contractor</h3>
                <p className="text-base text-gray-800">{project.generalContractor}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TitlePage;