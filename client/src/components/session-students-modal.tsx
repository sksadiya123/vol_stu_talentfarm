import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Users, Mail, Calendar } from "lucide-react";
import type { BookingWithDetails } from "@shared/schema";

interface SessionStudentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  sessionId: number;
  sessionTitle: string;
}

export function SessionStudentsModal({ 
  isOpen, 
  onClose, 
  sessionId, 
  sessionTitle 
}: SessionStudentsModalProps) {
  const { data: bookings, isLoading } = useQuery<BookingWithDetails[]>({
    queryKey: ['/api/sessions', sessionId, 'bookings'],
    queryFn: async () => {
      const res = await fetch(`/api/sessions/${sessionId}/bookings`);
      if (!res.ok) throw new Error('Failed to fetch bookings');
      return res.json();
    },
    enabled: isOpen,
  });

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Students Enrolled in "{sessionTitle}"
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
              <p className="text-gray-600 mt-2">Loading students...</p>
            </div>
          ) : bookings && bookings.length > 0 ? (
            <>
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-600">
                  {bookings.length} student{bookings.length !== 1 ? 's' : ''} enrolled
                </p>
                <Badge variant="secondary" className="bg-green-100 text-green-800">
                  Active Session
                </Badge>
              </div>
              
              <div className="space-y-3">
                {bookings.map((booking) => (
                  <Card key={booking.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-4">
                        <Avatar className="h-12 w-12">
                          <AvatarImage 
                            src={booking.student.profilePicture || undefined} 
                            alt={`${booking.student.firstName} ${booking.student.lastName}`} 
                          />
                          <AvatarFallback className="bg-blue-100 text-blue-600 font-semibold">
                            {booking.student.firstName.charAt(0)}{booking.student.lastName.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900">
                            {booking.student.firstName} {booking.student.lastName}
                          </h3>
                          <div className="flex items-center space-x-4 text-sm text-gray-500">
                            <span className="flex items-center">
                              <Mail className="w-4 h-4 mr-1" />
                              {booking.student.email}
                            </span>
                            <span className="flex items-center">
                              <Calendar className="w-4 h-4 mr-1" />
                              Enrolled {new Date(booking.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          {booking.student.description && (
                            <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                              {booking.student.description}
                            </p>
                          )}
                        </div>
                        
                        <Badge 
                          variant={booking.status === 'active' ? 'default' : 'secondary'}
                          className={booking.status === 'active' ? 'bg-green-500' : ''}
                        >
                          {booking.status}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No students enrolled yet</h3>
              <p className="text-gray-600">
                Students will appear here once they book this session.
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}