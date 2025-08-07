import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { Info } from "lucide-react";
import type { SessionWithVolunteer } from "@shared/schema";

interface CreateSessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  editSession?: SessionWithVolunteer;
}

export function CreateSessionModal({ isOpen, onClose, editSession }: CreateSessionModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    subject: '',
    maxStudents: '5',
    date: '',
    time: '',
    duration: '60',
    location: '',
    requirements: ''
  });
  const { toast } = useToast();
  const isEditing = !!editSession;

  // Initialize form data when editing
  useEffect(() => {
    if (editSession) {
      const sessionDate = new Date(editSession.date);
      const dateStr = sessionDate.toISOString().split('T')[0];
      const timeStr = sessionDate.toTimeString().slice(0, 5);
      
      setFormData({
        title: editSession.title || '',
        description: editSession.description || '',
        subject: editSession.subject || '',
        maxStudents: editSession.maxStudents?.toString() || '5',
        date: dateStr,
        time: timeStr,
        duration: editSession.duration?.toString() || '60',
        location: editSession.location || '',
        requirements: editSession.requirements || ''
      });
    } else {
      // Reset form for new session
      setFormData({
        title: '',
        description: '',
        subject: '',
        maxStudents: '5',
        date: '',
        time: '',
        duration: '60',
        location: '',
        requirements: ''
      });
    }
  }, [editSession, isOpen]);

  const sessionMutation = useMutation({
    mutationFn: async (data: any) => {
      const url = isEditing ? `/api/sessions/${editSession.id}` : "/api/sessions";
      const method = isEditing ? "PUT" : "POST";
      
      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || `Failed to ${isEditing ? 'update' : 'create'} session`);
      }

      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/sessions/my'] });
      queryClient.invalidateQueries({ queryKey: ['/api/sessions'] });
      queryClient.invalidateQueries({ queryKey: ['/api/volunteer/stats'] });
      
      toast({
        title: `Session ${isEditing ? 'updated' : 'created'}!`,
        description: `Your session has been successfully ${isEditing ? 'updated' : 'created'}.`,
      });
      onClose();
    },
    onError: (error: Error) => {
      toast({
        title: `Failed to ${isEditing ? 'update' : 'create'} session`,
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    
    const sessionData = {
      title: formData.title,
      description: formData.description,
      subject: formData.subject,
      maxStudents: parseInt(formData.maxStudents),
      date: formData.date,
      time: formData.time,
      duration: parseInt(formData.duration),
      location: formData.location,
      requirements: formData.requirements,
    };

    try {
      await sessionMutation.mutateAsync(sessionData);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Edit Session' : 'Create New Session'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label htmlFor="title">Session Title <span className="text-red-500">*</span></Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              placeholder="e.g., Introduction to Calculus"
              required
            />
          </div>

          <div>
            <Label htmlFor="description">Description <span className="text-red-500">*</span></Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Describe what students will learn in this session..."
              rows={4}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="subject">Subject <span className="text-red-500">*</span></Label>
              <Select value={formData.subject} onValueChange={(value) => handleInputChange('subject', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a subject" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Mathematics">Mathematics</SelectItem>
                  <SelectItem value="Physics">Physics</SelectItem>
                  <SelectItem value="Chemistry">Chemistry</SelectItem>
                  <SelectItem value="Biology">Biology</SelectItem>
                  <SelectItem value="Computer Science">Computer Science</SelectItem>
                  <SelectItem value="English">English</SelectItem>
                  <SelectItem value="History">History</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="maxStudents">Max Students <span className="text-red-500">*</span></Label>
              <Select value={formData.maxStudents} onValueChange={(value) => handleInputChange('maxStudents', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="5" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1</SelectItem>
                  <SelectItem value="2">2</SelectItem>
                  <SelectItem value="3">3</SelectItem>
                  <SelectItem value="4">4</SelectItem>
                  <SelectItem value="5">5</SelectItem>
                  <SelectItem value="6">6</SelectItem>
                  <SelectItem value="8">8</SelectItem>
                  <SelectItem value="10">10</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="date">Date <span className="text-red-500">*</span></Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => handleInputChange('date', e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                required
              />
            </div>
            <div>
              <Label htmlFor="time">Time <span className="text-red-500">*</span></Label>
              <Input
                id="time"
                type="time"
                value={formData.time}
                onChange={(e) => handleInputChange('time', e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="duration">Duration (minutes) <span className="text-red-500">*</span></Label>
              <Select value={formData.duration} onValueChange={(value) => handleInputChange('duration', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="60" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="30">30 Minutes</SelectItem>
                  <SelectItem value="45">45 Minutes</SelectItem>
                  <SelectItem value="60">1 Hour</SelectItem>
                  <SelectItem value="90">90 Minutes</SelectItem>
                  <SelectItem value="120">2 Hours</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="location">Location <span className="text-red-500">*</span></Label>
            <Input
              id="location"
              value={formData.location}
              onChange={(e) => handleInputChange('location', e.target.value)}
              placeholder="e.g., Community Center, Room 101 or Online Session"
              required
            />
          </div>

          <div>
            <Label htmlFor="requirements">Prerequisites/Requirements</Label>
            <Textarea
              id="requirements"
              value={formData.requirements}
              onChange={(e) => handleInputChange('requirements', e.target.value)}
              placeholder="e.g., Basic algebra knowledge required"
              rows={3}
            />
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start">
              <Info className="text-blue-500 h-5 w-5 mt-1 mr-3 flex-shrink-0" />
              <div>
                <h4 className="font-medium text-blue-900 mb-1">
                  {isEditing ? 'Edit Guidelines:' : 'Session Guidelines:'}
                </h4>
                <p className="text-sm text-blue-700">
                  {isEditing 
                    ? 'Changes will be reflected for all enrolled students. Students will be notified of any updates.'
                    : 'Please ensure the scheduled time is accurate. Students will be contacted once you create this session.'
                  }
                </p>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {isLoading 
                ? (isEditing ? "Updating..." : "Creating...") 
                : (isEditing ? "Update Session" : "Create Session")
              }
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}