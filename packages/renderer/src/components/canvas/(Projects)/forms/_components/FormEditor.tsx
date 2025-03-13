// FORMS EDITOR
// /Users/matthewsimon/Documents/Github/solomon-Desktop-App/packages/renderer/src/components/canvas/(Projects)/forms/_components/FormEditor.tsx

'use client';

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ImageIcon, PlusIcon, XIcon, SaveIcon } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { ProjectData } from "@/lib/store/formsStore";

interface FormEditorProps {
  project: ProjectData;
  onUpdate: (updatedProject: ProjectData) => void;
}

const FormEditor: React.FC<FormEditorProps> = ({ project, onUpdate }) => {
  const [currentData, setCurrentData] = useState<ProjectData>({ ...project });
  const [activeSection, setActiveSection] = useState<"general" | "client" | "timeline" | "photos">("general");
  
  // Update local state when project prop changes
  useEffect(() => {
    setCurrentData({ ...project });
  }, [project]);
  
  // Handle input changes
  const handleChange = (field: string, value: string | number) => {
    const newData = { ...currentData };
    
    // Handle nested fields like customer.name
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      newData[parent][child] = value;
    } else {
      newData[field] = value;
    }
    
    setCurrentData(newData);
    
    // Propagate changes to parent component
    onUpdate(newData);
  };
  
  // Handle adding a new photo
  const handleAddPhoto = () => {
    const newPhoto = {
      id: `photo-${Date.now()}`,
      caption: "New photo",
      date: new Date().toISOString().split('T')[0],
      url: "/api/placeholder/400/300"
    };
    
    const newData = {
      ...currentData,
      photos: [...currentData.photos, newPhoto]
    };
    
    setCurrentData(newData);
    onUpdate(newData);
  };
  
  // Handle removing a photo
  const handleRemovePhoto = (photoId: string) => {
    const newData = {
      ...currentData,
      photos: currentData.photos.filter(photo => photo.id !== photoId)
    };
    
    setCurrentData(newData);
    onUpdate(newData);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-auto p-4">
        <Tabs value={activeSection} onValueChange={(v) => setActiveSection(v as any)}>
          <TabsList className="mb-4">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="client">Client Info</TabsTrigger>
            <TabsTrigger value="timeline">Timeline</TabsTrigger>
            <TabsTrigger value="photos">Photos</TabsTrigger>
          </TabsList>
          
          {/* General Info Section */}
          <TabsContent value="general" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Project Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Project Title</Label>
                    <Input 
                      id="title" 
                      value={currentData.title} 
                      onChange={(e) => handleChange('title', e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="projectNumber">Project Number</Label>
                    <Input 
                      id="projectNumber" 
                      value={currentData.projectNumber} 
                      onChange={(e) => handleChange('projectNumber', e.target.value)}
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="location">Project Location</Label>
                    <Input 
                      id="location" 
                      value={currentData.location} 
                      onChange={(e) => handleChange('location', e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="date">Report Date</Label>
                    <Input 
                      id="date" 
                      type="date" 
                      value={currentData.date} 
                      onChange={(e) => handleChange('date', e.target.value)}
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="architect">Architect</Label>
                    <Input 
                      id="architect" 
                      value={currentData.architect} 
                      onChange={(e) => handleChange('architect', e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="generalContractor">General Contractor</Label>
                    <Input 
                      id="generalContractor" 
                      value={currentData.generalContractor} 
                      onChange={(e) => handleChange('generalContractor', e.target.value)}
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="contractAmount">Contract Amount</Label>
                    <Input 
                      id="contractAmount" 
                      value={currentData.contractAmount} 
                      onChange={(e) => handleChange('contractAmount', e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="poNumber">PO Number</Label>
                    <Input 
                      id="poNumber" 
                      value={currentData.poNumber} 
                      onChange={(e) => handleChange('poNumber', e.target.value)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Client Info Section */}
          <TabsContent value="client" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Client Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="customerName">Client Name</Label>
                  <Input 
                    id="customerName" 
                    value={currentData.customer.name} 
                    onChange={(e) => handleChange('customer.name', e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="customerAddress">Address</Label>
                  <Textarea 
                    id="customerAddress" 
                    value={currentData.customer.address} 
                    onChange={(e) => handleChange('customer.address', e.target.value)}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="customerContact">Contact Person</Label>
                    <Input 
                      id="customerContact" 
                      value={currentData.customer.contact} 
                      onChange={(e) => handleChange('customer.contact', e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="customerPhone">Phone</Label>
                    <Input 
                      id="customerPhone" 
                      value={currentData.customer.phone} 
                      onChange={(e) => handleChange('customer.phone', e.target.value)}
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="customerEmail">Email</Label>
                  <Input 
                    id="customerEmail" 
                    type="email" 
                    value={currentData.customer.email} 
                    onChange={(e) => handleChange('customer.email', e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Timeline Section */}
          <TabsContent value="timeline" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Project Timeline</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="startDate">Start Date</Label>
                    <Input 
                      id="startDate" 
                      type="date" 
                      value={currentData.startDate} 
                      onChange={(e) => handleChange('startDate', e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="estimatedCompletion">Estimated Completion</Label>
                    <Input 
                      id="estimatedCompletion" 
                      type="date" 
                      value={currentData.estimatedCompletion} 
                      onChange={(e) => handleChange('estimatedCompletion', e.target.value)}
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="currentPhase">Current Phase</Label>
                  <Input 
                    id="currentPhase" 
                    value={currentData.currentPhase} 
                    onChange={(e) => handleChange('currentPhase', e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="progressPercentage">Progress Percentage</Label>
                  <div className="flex items-center gap-2">
                    <Input 
                      id="progressPercentage" 
                      type="number" 
                      min="0" 
                      max="100" 
                      value={currentData.progressPercentage} 
                      onChange={(e) => handleChange('progressPercentage', parseInt(e.target.value))}
                    />
                    <span>%</span>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="notes">Project Notes</Label>
                  <Textarea 
                    id="notes" 
                    rows={5} 
                    value={currentData.notes} 
                    onChange={(e) => handleChange('notes', e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Photos Section */}
          <TabsContent value="photos" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Photo Documentation</CardTitle>
                <Button onClick={handleAddPhoto} size="sm" className="flex items-center gap-1">
                  <PlusIcon className="w-4 h-4" />
                  <span>Add Photo</span>
                </Button>
              </CardHeader>
              <CardContent>
                {currentData.photos.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <ImageIcon className="mx-auto h-12 w-12 opacity-30 mb-2" />
                    <p>No photos have been added yet.</p>
                    <p className="text-sm">Click "Add Photo" to get started.</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {currentData.photos.map((photo, index) => (
                      <div key={photo.id} className="border rounded-lg overflow-hidden">
                        <div className="bg-gray-50 px-4 py-2 flex justify-between items-center">
                          <h3 className="font-medium">Photo {index + 1}</h3>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => handleRemovePhoto(photo.id)}
                            className="h-8 w-8 p-0"
                          >
                            <XIcon className="h-4 w-4" />
                          </Button>
                        </div>
                        
                        <div className="p-4 grid md:grid-cols-2 gap-4">
                          <div>
                            <div className="aspect-video bg-gray-100 mb-2 overflow-hidden">
                              <img 
                                src={photo.url} 
                                alt={photo.caption} 
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <Button variant="outline" className="w-full">
                              Upload New Image
                            </Button>
                          </div>
                          
                          <div className="space-y-4">
                            <div className="space-y-2">
                              <Label htmlFor={`photo-caption-${photo.id}`}>Caption</Label>
                              <Input 
                                id={`photo-caption-${photo.id}`} 
                                value={photo.caption} 
                                onChange={(e) => {
                                  const updatedPhotos = [...currentData.photos];
                                  const photoIndex = updatedPhotos.findIndex(p => p.id === photo.id);
                                  updatedPhotos[photoIndex] = {
                                    ...updatedPhotos[photoIndex],
                                    caption: e.target.value
                                  };
                                  
                                  const newData = {
                                    ...currentData,
                                    photos: updatedPhotos
                                  };
                                  
                                  setCurrentData(newData);
                                  onUpdate(newData);
                                }}
                              />
                            </div>
                            
                            <div className="space-y-2">
                              <Label htmlFor={`photo-date-${photo.id}`}>Date</Label>
                              <Input 
                                id={`photo-date-${photo.id}`} 
                                type="date" 
                                value={photo.date} 
                                onChange={(e) => {
                                  const updatedPhotos = [...currentData.photos];
                                  const photoIndex = updatedPhotos.findIndex(p => p.id === photo.id);
                                  updatedPhotos[photoIndex] = {
                                    ...updatedPhotos[photoIndex],
                                    date: e.target.value
                                  };
                                  
                                  const newData = {
                                    ...currentData,
                                    photos: updatedPhotos
                                  };
                                  
                                  setCurrentData(newData);
                                  onUpdate(newData);
                                }}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default FormEditor;