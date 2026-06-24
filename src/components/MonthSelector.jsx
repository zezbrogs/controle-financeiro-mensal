import { monthName } from '../utils/finance.js';

const months = Array.from({ length: 12 }, (_, index) => ({
  value: index,
  label: monthName(index),
}));

export default function MonthSelector({ selectedMonth, onChange }) {
  const updateMonth = (month) => {
    onChange({ ...selectedMonth, month: Number(month) });
  };

  const updateYear = (year) => {
    onChange({ ...selectedMonth, year: Number(year) });
  };

  const goToPreviousMonth = () => {
    const date = new Date(selectedMonth.year, selectedMonth.month - 1, 1);
    onChange({ year: date.getFullYear(), month: date.getMonth() });
  };

  const goToNextMonth = () => {
    const date = new Date(selectedMonth.year, selectedMonth.month + 1, 1);
    onChange({ year: date.getFullYear(), month: date.getMonth() });
  };

  return (
    <div className="month-selector" aria-label="Selecionar mês e ano">
      <select value={selectedMonth.month} onChange={(event) => updateMonth(event.target.value)} aria-label="Mês">
        {months.map((month) => (
          <option key={month.value} value={month.value}>
            {month.label}
          </option>
        ))}
      </select>
      <input
        type="number"
        min="2000"
        max="2100"
        value={selectedMonth.year}
        onChange={(event) => updateYear(event.target.value)}
        aria-label="Ano"
      />
      <div className="month-nav-buttons" aria-label="Navegar entre meses">
        <button type="button" className="icon-button" onClick={goToPreviousMonth} aria-label="Mês anterior">
          ‹
        </button>
        <button type="button" className="icon-button" onClick={goToNextMonth} aria-label="Próximo mês">
          ›
        </button>
      </div>
    </div>
  );
}
