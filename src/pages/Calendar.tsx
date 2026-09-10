import { useState, useEffect } from 'react';
import { calendarService } from '../services';
import { Card, Badge, LoadingSpinner, EmptyState } from '../components/Layout';
import type { CalendarEvent } from '../types';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, ClipboardList, FileText, Video, Megaphone } from 'lucide-react';

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  useEffect(() => { loadEvents(); }, [currentDate]);

  const loadEvents = async () => {
    setLoading(true);
    try {
      const start = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).toISOString();
      const end = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).toISOString();
      const data = await calendarService.getEvents(start, end);
      setEvents(data);
    } catch (error) { console.error(error); }
    finally { setLoading(false); }
  };

  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();
  const monthName = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });

  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));

  const getEventsForDate = (day: number) => {
    const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return events.filter(e => e.event_date.startsWith(dateStr));
  };

  const selectedDateEvents = selectedDate ? events.filter(e => e.event_date.startsWith(selectedDate)) : [];

  const eventTypeIcons: Record<string, any> = {
    assignment: ClipboardList,
    exam: FileText,
    jitsi: Video,
    announcement: Megaphone,
  };

  const eventTypeColors: Record<string, string> = {
    assignment: 'bg-green-100 text-green-700',
    exam: 'bg-red-100 text-red-700',
    jitsi: 'bg-purple-100 text-purple-700',
    announcement: 'bg-blue-100 text-blue-700',
    other: 'bg-gray-100 text-gray-700',
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Calendar</h1>
        <p className="text-gray-600 mt-1">View upcoming events and deadlines</p>
      </div>

      <Card>
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <button onClick={prevMonth} className="p-2 rounded-lg hover:bg-gray-100"><ChevronLeft size={20} /></button>
          <h2 className="text-lg font-semibold text-gray-900">{monthName}</h2>
          <button onClick={nextMonth} className="p-2 rounded-lg hover:bg-gray-100"><ChevronRight size={20} /></button>
        </div>

        {/* Day names */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="text-center text-xs font-medium text-gray-500 py-2">{day}</div>
          ))}
        </div>

        {/* Days */}
        {loading ? <LoadingSpinner /> : (
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: firstDayOfMonth }, (_, i) => (
              <div key={`empty-${i}`} className="aspect-square" />
            ))}
            {Array.from({ length: daysInMonth }, (_, i) => {
              const day = i + 1;
              const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              const dayEvents = getEventsForDate(day);
              const isToday = dateStr === new Date().toISOString().split('T')[0];
              const isSelected = selectedDate === dateStr;

              return (
                <button
                  key={day}
                  onClick={() => setSelectedDate(dateStr)}
                  className={`aspect-square p-1 rounded-lg text-sm relative transition-colors ${isToday ? 'bg-primary-100 text-primary-700 font-bold' : isSelected ? 'bg-gray-200' : 'hover:bg-gray-50'}`}
                >
                  <span>{day}</span>
                  {dayEvents.length > 0 && (
                    <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-0.5">
                      {dayEvents.slice(0, 3).map((e, idx) => (
                        <div key={idx} className={`w-1.5 h-1.5 rounded-full ${e.event_type === 'assignment' ? 'bg-green-500' : e.event_type === 'exam' ? 'bg-red-500' : e.event_type === 'jitsi' ? 'bg-purple-500' : 'bg-blue-500'}`} />
                      ))}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </Card>

      {/* Selected date events */}
      {selectedDate && (
        <Card>
          <h3 className="font-semibold text-gray-900 mb-3">
            Events on {new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </h3>
          {selectedDateEvents.length === 0 ? (
            <p className="text-sm text-gray-500">No events on this date</p>
          ) : (
            <div className="space-y-2">
              {selectedDateEvents.map(event => {
                const Icon = eventTypeIcons[event.event_type] || CalendarIcon;
                return (
                  <div key={event.id} className="flex items-center gap-3 p-3 rounded-lg bg-gray-50">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${eventTypeColors[event.event_type] || 'bg-gray-100'}`}>
                      <Icon size={16} />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{event.title}</p>
                      <p className="text-xs text-gray-500 capitalize">{event.event_type}{event.group ? ` • ${event.group.name}` : ''}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      )}

      {/* Legend */}
      <Card>
        <h3 className="text-sm font-medium text-gray-700 mb-2">Legend</h3>
        <div className="flex flex-wrap gap-4">
          <span className="flex items-center gap-2 text-sm"><span className="w-3 h-3 rounded-full bg-green-500" /> Assignments</span>
          <span className="flex items-center gap-2 text-sm"><span className="w-3 h-3 rounded-full bg-red-500" /> Exams</span>
          <span className="flex items-center gap-2 text-sm"><span className="w-3 h-3 rounded-full bg-purple-500" /> Live Sessions</span>
          <span className="flex items-center gap-2 text-sm"><span className="w-3 h-3 rounded-full bg-blue-500" /> Announcements</span>
        </div>
      </Card>
    </div>
  );
}
