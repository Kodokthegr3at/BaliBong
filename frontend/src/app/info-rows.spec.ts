import { toInfoRows, HOURS_SEPARATOR, CONTACT_SEPARATOR } from './info-rows';

describe('toInfoRows', () => {
  it('splits hours into day/time rows without breaking clock times', () => {
    expect(toInfoRows('Senin, Selasa, Kamis-Minggu: 11:30 - 14:30 & 17:30 - 00:00. Tutup: Rabu.', HOURS_SEPARATOR)).toEqual([
      { label: 'Senin, Selasa, Kamis-Minggu', value: '11:30 - 14:30 & 17:30 - 00:00' },
      { label: 'Tutup', value: 'Rabu' }
    ]);
    expect(toInfoRows('周一、周二、周四至周日：11:30 - 14:30 & 17:30 - 00:00。 休息日：周三', HOURS_SEPARATOR)).toEqual([
      { label: '周一、周二、周四至周日', value: '11:30 - 14:30 & 17:30 - 00:00' },
      { label: '休息日', value: '周三' }
    ]);
  });

  it('splits contact pairs and keeps unlabeled lines', () => {
    expect(toInfoRows('电话：06-6695-6267 | 地址：大阪府大阪市住吉区苅田3-16-11', CONTACT_SEPARATOR)).toEqual([
      { label: '电话', value: '06-6695-6267' },
      { label: '地址', value: '大阪府大阪市住吉区苅田3-16-11' }
    ]);
    expect(toInfoRows('Buka setiap hari', HOURS_SEPARATOR)).toEqual([{ label: 'Buka setiap hari', value: '' }]);
    expect(toInfoRows('', HOURS_SEPARATOR)).toEqual([]);
  });
});
