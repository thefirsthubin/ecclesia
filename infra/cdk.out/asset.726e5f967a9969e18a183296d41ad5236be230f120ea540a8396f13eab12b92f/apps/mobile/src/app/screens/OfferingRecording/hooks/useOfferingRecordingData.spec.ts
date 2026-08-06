import { parseAmountToMinorUnits } from './useOfferingRecordingData';

describe('parseAmountToMinorUnits', () => {
  it.each([
    ['50', '5000'],
    ['50.5', '5050'],
    ['50.50', '5050'],
    ['0.99', '99'],
    ['0.1', '10'],
    ['0.01', '1'],
    ['100', '10000'],
    ['007', '700'],
  ])('parses "%s" GHS as "%s" minor units', (input, expected) => {
    expect(parseAmountToMinorUnits(input)).toBe(expected);
  });

  it.each([
    ['0'],
    ['0.0'],
    ['0.00'],
    [''],
    ['   '],
    ['-5'],
    ['5.555'],
    ['abc'],
    ['5,000'],
    ['5.'],
  ])('rejects "%s" as not a valid positive amount', (input) => {
    expect(parseAmountToMinorUnits(input)).toBeNull();
  });
});
