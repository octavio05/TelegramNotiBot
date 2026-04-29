export enum Weekday {
    MONDAY = 'monday',
    TUESDAY = 'tuesday',
    WEDNESDAY = 'wednesday',
    THURSDAY = 'thursday',
    FRIDAY = 'friday',
    SATURDAY = 'saturday',
}

export const WeekdayLabels: Record<Weekday, string> = {
    [Weekday.MONDAY]: 'Lunes',
    [Weekday.TUESDAY]: 'Martes',
    [Weekday.WEDNESDAY]: 'Miércoles',
    [Weekday.THURSDAY]: 'Jueves',
    [Weekday.FRIDAY]: 'Viernes',
    [Weekday.SATURDAY]: 'Sábado',
};
