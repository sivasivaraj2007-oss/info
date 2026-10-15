import { AttendanceRecord, Subject, StudentAttendanceSummary, SubjectAttendanceStat } from '../types/attendance';

export const calculateAttendance = (
  records: AttendanceRecord[],
  subjects: Subject[],
  targetThreshold = 75
): StudentAttendanceSummary => {
  const totalConducted = records.length;
  
  // Present classes count includes 'Present' and 'On Duty'
  const presentCount = records.filter(r => r.status === 'Present' || r.status === 'On Duty').length;
  const absentCount = records.filter(r => r.status === 'Absent' || r.status === 'Late').length;

  let overallPercentage = 100;
  if (totalConducted > 0) {
    overallPercentage = Number(((presentCount / totalConducted) * 100).toFixed(1));
  }

  const isLow = overallPercentage < targetThreshold && totalConducted > 0;

  // Calculate minimum consecutive sessions needed to attain targetThreshold
  let sessionsNeeded = 0;
  if (isLow && targetThreshold < 100) {
    const targetDecimal = targetThreshold / 100;
    const numerator = targetDecimal * totalConducted - presentCount;
    const denominator = 1 - targetDecimal;
    if (denominator > 0 && numerator > 0) {
      sessionsNeeded = Math.ceil(numerator / denominator);
    }
  }

  // Subject-wise calculation
  const subjectMap = new Map<string, Subject>();
  subjects.forEach(s => subjectMap.set(s.id, s));

  // Group records by subject_id
  const subjectRecords = new Map<string, AttendanceRecord[]>();
  records.forEach(r => {
    const list = subjectRecords.get(r.subject_id) || [];
    list.push(r);
    subjectRecords.set(r.subject_id, list);
  });

  const subjectBreakdown: SubjectAttendanceStat[] = subjects.map(subject => {
    const subjRecords = subjectRecords.get(subject.id) || [];
    const conducted = subjRecords.length;
    const present = subjRecords.filter(r => r.status === 'Present' || r.status === 'On Duty').length;
    const absent = subjRecords.filter(r => r.status === 'Absent' || r.status === 'Late').length;
    
    let pct = 100;
    if (conducted > 0) {
      pct = Number(((present / conducted) * 100).toFixed(1));
    }

    return {
      subject_id: subject.id,
      subject_code: subject.code,
      subject_name: subject.name,
      total_conducted: conducted,
      present_count: present,
      absent_count: absent,
      percentage: pct,
      is_low: pct < targetThreshold && conducted > 0,
    };
  });

  return {
    total_conducted: totalConducted,
    present_count: presentCount,
    absent_count: absentCount,
    overall_percentage: overallPercentage,
    is_low: isLow,
    sessions_needed_for_target: sessionsNeeded,
    subject_breakdown: subjectBreakdown,
  };
};

export interface MonthlyAttendancePoint {
  month: string;
  total: number;
  present: number;
  absent: number;
  percentage: number;
}

export const getMonthlyAttendanceTrends = (records: AttendanceRecord[]): MonthlyAttendancePoint[] => {
  const monthMap = new Map<string, { total: number; present: number; absent: number }>();

  records.forEach(r => {
    // Format YYYY-MM
    const monthKey = r.date.slice(0, 7);
    const existing = monthMap.get(monthKey) || { total: 0, present: 0, absent: 0 };
    existing.total += 1;
    if (r.status === 'Present' || r.status === 'On Duty') {
      existing.present += 1;
    } else {
      existing.absent += 1;
    }
    monthMap.set(monthKey, existing);
  });

  const sortedMonths = Array.from(monthMap.keys()).sort();

  return sortedMonths.map(m => {
    const data = monthMap.get(m)!;
    const [year, monthNum] = m.split('-');
    const dateObj = new Date(parseInt(year), parseInt(monthNum) - 1, 1);
    const monthName = dateObj.toLocaleString('default', { month: 'short' });

    const pct = data.total > 0 ? Number(((data.present / data.total) * 100).toFixed(1)) : 100;

    return {
      month: `${monthName} ${year.slice(2)}`,
      total: data.total,
      present: data.present,
      absent: data.absent,
      percentage: pct,
    };
  });
};
