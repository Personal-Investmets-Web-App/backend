export const compareDates = (date1: Date, date2: Date) => {
  return date1.getTime() === date2.getTime();
};

export const isDateBefore = (date1: Date, date2: Date) => {
  return date1.getTime() < date2.getTime();
};

export const isDateAfter = (date1: Date, date2: Date) => {
  return date1.getTime() > date2.getTime();
};

export const isDateBetween = (date: Date, startDate: Date, endDate: Date) => {
  return (
    date.getTime() >= startDate.getTime() && date.getTime() <= endDate.getTime()
  );
};
