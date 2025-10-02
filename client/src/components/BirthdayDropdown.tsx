// BirthdayDropdown.tsx

import { useEffect, useState } from "react";

type BirthdayDropdownProps = {
  value?: string; // Optional controlled value (MM-DD-YYYY)
  onChange: (formattedDate: string) => void;
  error?: string;
};

const BirthdayDropdown: React.FC<BirthdayDropdownProps> = ({ value, onChange, error }) => {
  const [month, setMonth] = useState('');
  const [day, setDay] = useState('');
  const [year, setYear] = useState('');

  // Sync internal state with `value` prop when it changes
  useEffect(() => {
    if (value) {
      const [mm, dd, yyyy] = value.split('-');
      const paddedMonth = mm.padStart(2, '0');
      const paddedDay = dd.padStart(2, '0');
      if (paddedMonth !== month || paddedDay !== day || yyyy !== year) {
        setMonth(paddedMonth);
        setDay(paddedDay);
        setYear(yyyy);
      }
    } else {
      setMonth('');
      setDay('');
      setYear('');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  // Emit formatted date on changes
  useEffect(() => {
    if (month && day && year) {
      const formatted = `${month.padStart(2, '0')}-${day.padStart(2, '0')}-${year}`;
      if (formatted !== value) {
        onChange(formatted);
      }
    }
  }, [month, day, year, onChange, value]);

  const currentYear = new Date().getFullYear();
  const maxYear = currentYear - 18;
  const minYear = 1900;
  const years = Array.from({ length: maxYear - minYear + 1 }, (_, i) => `${maxYear - i}`);

  const months = [
    { value: '1', label: 'January' },
    { value: '2', label: 'February' },
    { value: '3', label: 'March' },
    { value: '4', label: 'April' },
    { value: '5', label: 'May' },
    { value: '6', label: 'June' },
    { value: '7', label: 'July' },
    { value: '8', label: 'August' },
    { value: '9', label: 'September' },
    { value: '10', label: 'October' },
    { value: '11', label: 'November' },
    { value: '12', label: 'December' },
  ];

  // Calculate number of days based on month/year
  const getDaysInMonth = (month: string, year: string) => {
    if (!month || !year) return 31;
    return new Date(Number(year), Number(month), 0).getDate(); // 0 = last day of previous month
  };

  const daysInMonth = getDaysInMonth(month, year);
  const days = Array.from({ length: daysInMonth }, (_, i) => `${i + 1}`);

  const selectClass = `p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700 ${error ? 'border-red-500' : ''}`;

  return (
    <div className="flex gap-3">
      <select
        className={`${selectClass} w-36`}
        value={month}
        onChange={(e) => setMonth(e.target.value)}
        aria-label="Select month"
      >
        <option value="">Month</option>
        {months.map((m) => (
          <option key={m.value} value={m.value.padStart(2, '0')}>
            {m.label}
          </option>
        ))}
      </select>

      <select
        className={`${selectClass} w-24`}
        value={day}
        onChange={(e) => setDay(e.target.value)}
        aria-label="Select day"
      >
        <option value="">Day</option>
        {days.map((d) => (
          <option key={d} value={d.padStart(2, '0')}>
            {d}
          </option>
        ))}
      </select>

      <select
        className={`${selectClass} w-28`}
        value={year}
        onChange={(e) => setYear(e.target.value)}
        aria-label="Select year"
      >
        <option value="">Year</option>
        {years.map((y) => (
          <option key={y} value={y}>
            {y}
          </option>
        ))}
      </select>
    </div>
  );
};

export default BirthdayDropdown;