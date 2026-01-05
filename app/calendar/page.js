'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { 
  Calendar as CalendarIcon, ChevronLeft, ChevronRight, Check, Clock,
  MapPin, Users, MessageSquare, CheckSquare, Square, Plus, X, Edit2,
  Mountain, Coffee, Dumbbell, Music, Bike, Save, Globe, Lock, Trash2
} from 'lucide-react';
import Header from '@/components/Header';
import BottomNav from '@/components/BottomNav';
import { getUser } from '@/lib/auth';
import { toast } from 'sonner';

const activityIcons = {
  hiking: Mountain,
  coffee: Coffee,
  gym: Dumbbell,
  concert: Music,
  cycling: Bike
};

export default function CalendarPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [activities, setActivities] = useState([]);
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [showActivityModal, setShowActivityModal] = useState(false);
  const [editingActivity, setEditingActivity] = useState(null);
  
  // Availability State
  const [availabilitySlots, setAvailabilitySlots] = useState([
    { id: 1, days: 'Mon-Fri', startTime: '6:00 PM', endTime: '9:00 PM' },
    { id: 2, days: 'Thu', startTime: '10:00 AM', endTime: '8:00 PM' },
    { id: 3, days: 'Sat', startTime: '7:00 AM', endTime: '10:00 PM' },
  ]);
  const [availabilityPublic, setAvailabilityPublic] = useState(true);
  const [showAvailabilityModal, setShowAvailabilityModal] = useState(false);
  const [editingSlot, setEditingSlot] = useState(null);
  const [slotForm, setSlotForm] = useState({ days: '', startTime: '', endTime: '' });

  // Activity form state
  const [activityForm, setActivityForm] = useState({
    name: '',
    time: '',
    type: 'hiking',
    location: '',
    locationDetails: '',
    notes: '',
    checklist: [],
    newChecklistItem: '',
    connectionPreferences: {
      openToAnyone: true,
      buddyOnly: false,
      groupsAllowed: false,
      accessibleFriendly: false
    },
    broadcastMessage: '',
    isPublic: true
  });

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
      { 
        id: '1', 
        name: 'Morning Hike', 
        time: '9:00 AM', 
        partner: 'Sarah', 
        type: 'hiking', 
        completed: true, 
        date: new Date(),
        location: 'Bear Mountain Trail',
        locationDetails: 'Meet at main parking lot',
        checklist: [
          { id: 1, text: 'Water bottle', checked: true },
          { id: 2, text: 'Sunscreen', checked: true },
          { id: 3, text: 'Trail snacks', checked: false }
        ],
        notes: 'Bring hiking poles if available'
      },
      { 
        id: '2', 
        name: 'Morning Run', 
        time: '7:00 AM', 
        partner: 'Alex', 
        type: 'running', 
        completed: true, 
        date: new Date(),
        location: 'Central Park',
        checklist: []
      },
      { 
        id: '3', 
        name: 'Yoga Session', 
        time: '5:30 PM', 
        partner: 'Luna', 
        type: 'yoga', 
        completed: false, 
        date: new Date(),
        location: 'Zen Studio',
        checklist: [
          { id: 1, text: 'Yoga mat', checked: false },
          { id: 2, text: 'Water', checked: false }
        ]
      },
      { 
        id: '4', 
        name: 'Spin Session', 
        time: '6:00 PM', 
        partner: 'Mike', 
        type: 'cycling', 
        completed: false, 
        date: new Date(Date.now() + 86400000),
        location: 'SoulCycle Downtown'
      },
    ];
    setActivities(mockActivities);
  };

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    const days = [];
    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }
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

  const openActivityDetail = (activity) => {
    setSelectedActivity(activity);
    setActivityForm({
      name: activity.name,
      time: activity.time,
      type: activity.type,
      location: activity.location || '',
      locationDetails: activity.locationDetails || '',
      notes: activity.notes || '',
      checklist: activity.checklist || [],
      newChecklistItem: '',
      connectionPreferences: activity.connectionPreferences || {
        openToAnyone: true,
        buddyOnly: false,
        groupsAllowed: false,
        accessibleFriendly: false
      },
      broadcastMessage: activity.broadcastMessage || '',
      isPublic: activity.isPublic !== false
    });
    setShowActivityModal(true);
  };

  const addChecklistItem = () => {
    if (!activityForm.newChecklistItem.trim()) return;
    setActivityForm(prev => ({
      ...prev,
      checklist: [...prev.checklist, { 
        id: Date.now(), 
        text: prev.newChecklistItem, 
        checked: false 
      }],
      newChecklistItem: ''
    }));
  };

  const toggleChecklistItem = (itemId) => {
    setActivityForm(prev => ({
      ...prev,
      checklist: prev.checklist.map(item => 
        item.id === itemId ? { ...item, checked: !item.checked } : item
      )
    }));
  };

  const removeChecklistItem = (itemId) => {
    setActivityForm(prev => ({
      ...prev,
      checklist: prev.checklist.filter(item => item.id !== itemId)
    }));
  };

  const saveActivity = () => {
    // Update the activity
    setActivities(prev => prev.map(a => 
      a.id === selectedActivity.id 
        ? { ...a, ...activityForm }
        : a
    ));
    toast.success('Activity updated!');
    setShowActivityModal(false);
  };

  const broadcastActivity = () => {
    toast.success('Broadcasting activity to the community...');
    setTimeout(() => {
      toast.success('Activity broadcast sent!');
    }, 1500);
  };

  const days = getDaysInMonth(currentDate);
  const weekDays = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
  const selectedActivities = getActivitiesForDate(selectedDate);

  return (
    <div className="min-h-screen bg-gray-100 pb-20">
      <Header user={user} title="ACTIVITY LOG" />

      {/* Calendar */}
      <Card className="mx-4 mt-4 p-4">
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

        <div className="grid grid-cols-7 gap-1 mb-2">
          {weekDays.map((day, i) => (
            <div key={i} className="text-center text-sm font-medium text-gray-500 py-2">
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {days.map((day, i) => (
            <button
              key={i}
              onClick={() => day && setSelectedDate(day)}
              disabled={!day}
              className={`aspect-square flex flex-col items-center justify-center rounded-lg text-sm relative ${
                !day ? '' :
                isSameDay(day, selectedDate) ? 'bg-[#2B2D9E] text-white' :
                isSameDay(day, new Date()) ? 'bg-blue-100 text-[#2B2D9E]' :
                'hover:bg-gray-100'
              }`}
            >
              {day && (
                <>
                  <span>{day.getDate()}</span>
                  {hasActivity(day) && (
                    <div className={`w-1.5 h-1.5 rounded-full mt-1 ${
                      isSameDay(day, selectedDate) ? 'bg-white' : 'bg-[#2B2D9E]'
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
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-gray-800">
            {isSameDay(selectedDate, new Date()) ? 'Today\'s Activities' : 
             selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
          </h3>
          <Button 
            size="sm" 
            className="bg-[#2B2D9E]"
            onClick={() => {
              setSelectedActivity(null);
              setActivityForm({
                name: '',
                time: '',
                type: 'hiking',
                location: '',
                locationDetails: '',
                notes: '',
                checklist: [],
                newChecklistItem: '',
                connectionPreferences: {
                  openToAnyone: true,
                  buddyOnly: false,
                  groupsAllowed: false,
                  accessibleFriendly: false
                },
                broadcastMessage: '',
                isPublic: true
              });
              setShowActivityModal(true);
            }}
          >
            <Plus className="w-4 h-4 mr-1" /> Add
          </Button>
        </div>

        <div className="space-y-3">
          {selectedActivities.map((activity) => {
            const Icon = activityIcons[activity.type] || Mountain;
            return (
              <Card 
                key={activity.id} 
                className="p-4 cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => openActivityDetail(activity)}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                    activity.completed ? 'bg-green-100' : 'bg-blue-100'
                  }`}>
                    {activity.completed ? (
                      <Check className="w-6 h-6 text-green-600" />
                    ) : (
                      <Icon className="w-6 h-6 text-blue-600" />
                    )}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-800">{activity.name}</h4>
                    <p className="text-sm text-gray-500">{activity.time}</p>
                    {activity.location && (
                      <p className="text-xs text-gray-400 flex items-center gap-1 mt-1">
                        <MapPin className="w-3 h-3" />
                        {activity.location}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <Avatar className="w-8 h-8">
                      <AvatarFallback className="bg-[#4a3aff] text-white text-xs">
                        {activity.partner?.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <Edit2 className="w-4 h-4 text-gray-400 mt-2" />
                  </div>
                </div>
                
                {/* Checklist preview */}
                {activity.checklist && activity.checklist.length > 0 && (
                  <div className="mt-3 pt-3 border-t">
                    <p className="text-xs text-gray-500 mb-1">
                      Checklist: {activity.checklist.filter(c => c.checked).length}/{activity.checklist.length}
                    </p>
                    <div className="w-full bg-gray-200 rounded-full h-1.5">
                      <div 
                        className="bg-green-500 h-1.5 rounded-full"
                        style={{ 
                          width: `${(activity.checklist.filter(c => c.checked).length / activity.checklist.length) * 100}%` 
                        }}
                      ></div>
                    </div>
                  </div>
                )}
              </Card>
            );
          })}

          {selectedActivities.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <CalendarIcon className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>No activities scheduled</p>
              <Button 
                className="mt-4 bg-[#2B2D9E]"
                onClick={() => router.push('/dashboard')}
              >
                Plan Activity
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Activity Detail/Edit Modal */}
      {showActivityModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center">
          <div className="bg-white w-full max-w-lg rounded-t-3xl sm:rounded-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white p-4 border-b flex items-center justify-between">
              <h2 className="text-xl font-bold">
                {selectedActivity ? 'Edit Activity' : 'New Activity'}
              </h2>
              <button onClick={() => setShowActivityModal(false)}>
                <X className="w-6 h-6 text-gray-400" />
              </button>
            </div>

            <div className="p-4 space-y-4">
              {/* Basic Info */}
              <div className="space-y-3">
                <div>
                  <Label>Activity Name</Label>
                  <Input 
                    value={activityForm.name}
                    onChange={(e) => setActivityForm(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., Morning Hike"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Time</Label>
                    <Input 
                      value={activityForm.time}
                      onChange={(e) => setActivityForm(prev => ({ ...prev, time: e.target.value }))}
                      placeholder="e.g., 9:00 AM"
                    />
                  </div>
                  <div>
                    <Label>Type</Label>
                    <select 
                      className="w-full p-2 border rounded-md"
                      value={activityForm.type}
                      onChange={(e) => setActivityForm(prev => ({ ...prev, type: e.target.value }))}
                    >
                      <option value="hiking">Hiking</option>
                      <option value="running">Running</option>
                      <option value="cycling">Cycling</option>
                      <option value="gym">Gym</option>
                      <option value="yoga">Yoga</option>
                      <option value="coffee">Coffee</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Location */}
              <div className="space-y-3">
                <h3 className="font-semibold flex items-center gap-2">
                  <MapPin className="w-4 h-4" /> Location
                </h3>
                <Input 
                  value={activityForm.location}
                  onChange={(e) => setActivityForm(prev => ({ ...prev, location: e.target.value }))}
                  placeholder="Location name"
                />
                <Input 
                  value={activityForm.locationDetails}
                  onChange={(e) => setActivityForm(prev => ({ ...prev, locationDetails: e.target.value }))}
                  placeholder="Meeting point details (e.g., Main entrance)"
                />
              </div>

              {/* Checklist */}
              <div className="space-y-3">
                <h3 className="font-semibold flex items-center gap-2">
                  <CheckSquare className="w-4 h-4" /> Activity Checklist
                </h3>
                <div className="space-y-2">
                  {activityForm.checklist.map((item) => (
                    <div key={item.id} className="flex items-center gap-2">
                      <button onClick={() => toggleChecklistItem(item.id)}>
                        {item.checked ? (
                          <CheckSquare className="w-5 h-5 text-green-600" />
                        ) : (
                          <Square className="w-5 h-5 text-gray-400" />
                        )}
                      </button>
                      <span className={item.checked ? 'line-through text-gray-400' : ''}>
                        {item.text}
                      </span>
                      <button 
                        onClick={() => removeChecklistItem(item.id)}
                        className="ml-auto text-red-400 hover:text-red-600"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input 
                    value={activityForm.newChecklistItem}
                    onChange={(e) => setActivityForm(prev => ({ ...prev, newChecklistItem: e.target.value }))}
                    placeholder="Add item..."
                    onKeyPress={(e) => e.key === 'Enter' && addChecklistItem()}
                  />
                  <Button onClick={addChecklistItem} size="sm">
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Connection Preferences */}
              <div className="space-y-3">
                <h3 className="font-semibold flex items-center gap-2">
                  <Users className="w-4 h-4" /> Connection Preferences
                </h3>
                <div className="space-y-2">
                  {[
                    { key: 'openToAnyone', label: 'Open to anyone' },
                    { key: 'buddyOnly', label: 'Buddy connections only' },
                    { key: 'groupsAllowed', label: 'Allow groups' },
                    { key: 'accessibleFriendly', label: 'Accessible-friendly' }
                  ].map((pref) => (
                    <div key={pref.key} className="flex items-center justify-between">
                      <span className="text-sm">{pref.label}</span>
                      <Switch 
                        checked={activityForm.connectionPreferences[pref.key]}
                        onCheckedChange={(checked) => setActivityForm(prev => ({
                          ...prev,
                          connectionPreferences: { ...prev.connectionPreferences, [pref.key]: checked }
                        }))}
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Broadcast Message */}
              <div className="space-y-3">
                <h3 className="font-semibold flex items-center gap-2">
                  <MessageSquare className="w-4 h-4" /> Broadcast Message
                </h3>
                <Textarea 
                  value={activityForm.broadcastMessage}
                  onChange={(e) => setActivityForm(prev => ({ ...prev, broadcastMessage: e.target.value }))}
                  placeholder="Add a message to your broadcast (e.g., 'Looking for experienced hikers for a moderate trail!')"
                  rows={3}
                />
              </div>

              {/* Notes */}
              <div className="space-y-3">
                <h3 className="font-semibold">Additional Notes</h3>
                <Textarea 
                  value={activityForm.notes}
                  onChange={(e) => setActivityForm(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Any other details..."
                  rows={2}
                />
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={saveActivity}
                >
                  <Save className="w-4 h-4 mr-2" />
                  Save
                </Button>
                <Button 
                  className="flex-1 bg-[#2B2D9E]"
                  onClick={broadcastActivity}
                >
                  Broadcast
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

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
        <Button variant="outline" className="w-full mt-4 border-[#2B2D9E] text-[#2B2D9E]">
          Add Activity Request
        </Button>
      </Card>

      <BottomNav />
    </div>
  );
}
