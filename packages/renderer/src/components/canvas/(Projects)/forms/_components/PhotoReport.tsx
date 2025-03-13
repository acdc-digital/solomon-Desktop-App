// PHOTO-REPORT 
// /Users/matthewsimon/Documents/Github/solomon-Desktop-App/packages/renderer/src/components/canvas/(Projects)/forms/_components/PhotoReport.tsx

'use client';

import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

interface ProjectPhoto {
  id: string;
  caption: string;
  date: string;
  url: string;
}

interface ProjectData {
  title: string;
  projectNumber: string;
  date: string;
  photos: ProjectPhoto[];
  [key: string]: any;
}

interface PhotoReportPageProps {
  project: ProjectData;
}

const PhotoReportPage: React.FC<PhotoReportPageProps> = ({ project }) => {
  return (
    <div className="w-full h-[11in] flex flex-col p-8 bg-white">
      {/* Page Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Photo Documentation</h1>
        <div className="text-right">
          <p className="text-sm font-medium text-gray-600">Project #{project.projectNumber}</p>
          <p className="text-sm text-gray-500">{project.date}</p>
        </div>
      </div>
      
      <Separator className="mb-6" />
      
      {/* Project Title */}
      <h2 className="text-xl font-semibold text-gray-700 mb-4">{project.title}</h2>
      
      {/* Description */}
      <p className="text-sm text-gray-600 mb-6">
        The following photographs document key progress milestones and current site conditions
        as of the report date. All photos are date-stamped and captioned for reference.
      </p>
      
      {/* Photo Grid */}
      <div className="grid grid-cols-2 gap-6 mb-8">
        {project.photos.map((photo) => (
          <Card key={photo.id} className="overflow-hidden">
            <div className="aspect-video bg-gray-100 overflow-hidden">
              <img 
                src={photo.url} 
                alt={photo.caption} 
                className="w-full h-full object-cover"
              />
            </div>
            <CardContent className="p-3">
              <div className="flex justify-between items-start">
                <p className="text-sm font-medium text-gray-800">{photo.caption}</p>
                <p className="text-xs text-gray-500">{photo.date}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      {/* Additional Notes */}
      {project.photos.length < 1 ? (
        <Card className="mb-6">
          <CardContent className="p-4 text-center">
            <p className="text-gray-500">No photos have been added to this report yet.</p>
          </CardContent>
        </Card>
      ) : (
        <Card className="mb-6">
          <CardContent className="p-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">Photo Notes</h3>
            <p className="text-sm text-gray-600">
              All photographs are taken by the project manager on site and are stored securely 
              in our digital asset management system. Higher resolution versions are available 
              upon request. Photos are systematically organized by date and phase of construction.
            </p>
          </CardContent>
        </Card>
      )}
      
      {/* Upload Instructions - Only visible in edit mode, hidden when printing */}
      <div className="print:hidden mb-6">
        <Card className="border-dashed border-2">
          <CardContent className="p-4 text-center">
            <p className="text-gray-500">
              In edit mode, users will be able to upload, arrange, and caption photos here.
            </p>
          </CardContent>
        </Card>
      </div>
      
      {/* Footer */}
      <div className="mt-auto pt-4 text-xs text-gray-500 text-center">
        <p>Report generated by Solomon Project Management System on {project.date}</p>
        <p>Page 3 of 3</p>
      </div>
    </div>
  );
};

export default PhotoReportPage;