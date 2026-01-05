'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Check, Clock } from 'lucide-react';
import Header from '@/components/Header';
import BottomNav from '@/components/BottomNav';
import { getUser } from '@/lib/auth';

export default function CalendarPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [activities, setActivities] = useState([]);

  useEffect(() => {
    const storedUser = getUser();
    if (!storedUser) {
      router.push('/auth/signin');
      return;
    }
    setUser(storedUser);
    generateMockActivities();
  }, []);

  const generateMockActivities = () => {
    const mockActivities = [
      { id: '1', name: 'Morning Hike', time: '9:00 AM', partner: 'Sarah', type: 'hiking', completed: true, date: new Date() },
      { id: '2', name: 'Morning Run', time: '7:00 AM', partner: 'Alex', type: 'running', completed: true, date: new Date() },
      { id: '3', name: 'Yoga Session', time: '5:30 PM', partner: 'Luna', type: 'yoga', completed: false, date: new Date() },
      { id: '4', name: 'Spin Session', time: '6:00 PM', partner: 'Mike', type: 'cycling', completed: false, date: new Date(Date.now() + 86400000) },
    ];
    setActivities(mockActivities);
  };

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    const days = [];
    // Add empty cells for days before the first day of month
    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }
    // Add days of the month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }
    return days;
  };

  const isSameDay = (d1, d2) => {
    if (!d1 || !d2) return false;
    return d1.getDate() === d2.getDate() && 
           d1.getMonth() === d2.getMonth() && 
           d1.getFullYear() === d2.getFullYear();
  };

  const hasActivity = (date) => {
    return activities.some(a => isSameDay(new Date(a.date), date));
  };

  const getActivitiesForDate = (date) => {
    return activities.filter(a => isSameDay(new Date(a.date), date));
  };

  const navigateMonth = (direction) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + direction);
    setCurrentDate(newDate);
  };

  const days = getDaysInMonth(currentDate);
  const weekDays = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
  const selectedActivities = getActivitiesForDate(selectedDate);

  return (
    <div className="min-h-screen bg-gray-100 pb-20">
      <Header user={user} title="ACTIVITY LOG" />

      {/* Calendar */}
      <Card className="mx-4 mt-4 p-4">
        {/* Month Navigation */}
        <div className="flex items-center justify-between mb-4">
          <button onClick={() => navigateMonth(-1)} className="p-2">
            <ChevronLeft className="w-5 h-5 text-gray-600" />
          </button>
          <h2 className="font-bold text-gray-800">
            {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </h2>
          <button onClick={() => navigateMonth(1)} className="p-2">
            <ChevronRight className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Week Days */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {weekDays.map((day, i) => (
            <div key={i} className="text-center text-sm font-medium text-gray-500 py-2">
              {day}
            </div>
          ))}
        </div>

        {/* Days */}
        <div className="grid grid-cols-7 gap-1">
          {days.map((day, i) => (
            <button
              key={i}
              onClick={() => day && setSelectedDate(day)}
              disabled={!day}
              className={`aspect-square flex flex-col items-center justify-center rounded-lg text-sm relative ${
                !day ? '' :
                isSameDay(day, selectedDate) ? 'bg-[#1a1aff] text-white' :
                isSameDay(day, new Date()) ? 'bg-blue-100 text-[#1a1aff]' :
                'hover:bg-gray-100'
              }`}
            >
              {day && (
                <>
                  <span>{day.getDate()}</span>
                  {hasActivity(day) && (
                    <div className={`w-1.5 h-1.5 rounded-full mt-1 ${
                      isSameDay(day, selectedDate) ? 'bg-white' : 'bg-[#1a1aff]'
                    }`}></div>
                  )}
                </>
              )}
            </button>
          ))}
        </div>
      </Card>

      {/* Activities for Selected Date */}
      <div className="p-4">
        <h3 className="font-bold text-gray-800 mb-3">
          {isSameDay(selectedDate, new Date()) ? 'Today\'s Activities' : 
           selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
        </h3>

        <div className="space-y-3">
          {selectedActivities.map((activity) => (
            <Card key={activity.id} className="p-4 flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                activity.completed ? 'bg-green-100' : 'bg-blue-100'
              }`}>
                {activity.completed ? (
                  <Check className="w-5 h-5 text-green-600" />
                ) : (
                  <Clock className="w-5 h-5 text-blue-600" />
                )}
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-gray-800">{activity.name}</h4>
                <p className="text-sm text-gray-500">{activity.time}</p>
              </div>
              <Avatar className="w-8 h-8">
                <AvatarFallback className="bg-[#4a3aff] text-white text-xs">
                  {activity.partner?.charAt(0)}
                </AvatarFallback>
              </Avatar>
            </Card>
          ))}

          {selectedActivities.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <CalendarIcon className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>No activities scheduled</p>
              <Button 
                className="mt-4 bg-[#1a1aff]"
                onClick={() => router.push('/dashboard')}
              >
                Plan Activity
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* My Availability Section */}
      <Card className="mx-4 p-4">
        <h3 className="font-bold text-gray-800 mb-3">My Availability</h3>
        <div className="flex gap-2 flex-wrap">
          {['Mon-Fri\n6-9 PM', 'Thu\n10-8 PM', 'Sat\n7-10 PM'].map((slot, i) => (
            <div key={i} className="bg-gray-100 rounded-lg px-4 py-2 text-center">
              <p className="text-sm text-gray-700 whitespace-pre-line">{slot}</p>
            </div>
          ))}
        </div>
        <Button variant="outline" className="w-full mt-4 border-[#1a1aff] text-[#1a1aff]">
          Add Activity Request
        </Button>
      </Card>

      <BottomNav />
    </div>
  );
}
