import * as fs from 'fs';
import { ReadFile, FindGitModules, FindNPMModules, FindOtherModules, GenerateOutput } from './fileio';

beforeEach(() => {
    jest.clearAllMocks();
});

// test('ReadFile should read and split file contents correctly', () => {
//     // const mockReadFileSync = jest.spyOn(fs, 'readFileSync');
//     // mockReadFileSync.mockReturnValue('https://github.com/cloudinary/cloudinary_npm\nhttps://www.npmjs.com/package/express\nhttps://github.com/nullivex/nodist\nhttps://github.com/lodash/lodash\nhttps://www.npmjs.com/package/browserify');

//     const result = ReadFile('test.txt');
//     console.log(result);
//     expect(result).toEqual([
//         'https://github.com/cloudinary/cloudinary_npm',
//         'https://www.npmjs.com/package/express',
//         'https://github.com/nullivex/nodist',
//         'https://github.com/lodash/lodash',
//         'https://www.npmjs.com/package/browserify'
//     ]);
// });

test('FindGitModules should find GitHub modules correctly', () => {
    const urls = [
        'https://github.com/cloudinary/cloudinary_npm',
        'https://www.npmjs.com/package/express',
        'https://github.com/nullivex/nodist'
    ];
    const result = FindGitModules(urls);

    expect(result).toHaveLength(2);
    expect(result).toContainEqual({ URL: 'https://github.com/cloudinary/cloudinary_npm', NET_SCORE: 0, RAMP_UP_SCORE: 0, CORRECTNESS_SCORE: 0, BUS_FACTOR_SCORE: 0, RESPONSIVE_MAINTAINER_SCORE: 0, LICENSE_SCORE: 0 });
    expect(result).toContainEqual({ URL: 'https://github.com/nullivex/nodist', NET_SCORE: 0, RAMP_UP_SCORE: 0, CORRECTNESS_SCORE: 0, BUS_FACTOR_SCORE: 0, RESPONSIVE_MAINTAINER_SCORE: 0, LICENSE_SCORE: 0 });
});

test('FindNPMModules should find NPM modules correctly', () => {
    const urls = [
        'https://github.com/cloudinary/cloudinary_npm',
        'https://www.npmjs.com/package/express',
        'https://www.npmjs.com/package/browserify'
    ];
    const result = FindNPMModules(urls);

    expect(result).toHaveLength(2);
    expect(result).toContainEqual({ URL: 'https://www.npmjs.com/package/express', NET_SCORE: 0, RAMP_UP_SCORE: 0, CORRECTNESS_SCORE: 0, BUS_FACTOR_SCORE: 0, RESPONSIVE_MAINTAINER_SCORE: 0, LICENSE_SCORE: 0 });
    expect(result).toContainEqual({ URL: 'https://www.npmjs.com/package/browserify', NET_SCORE: 0, RAMP_UP_SCORE: 0, CORRECTNESS_SCORE: 0, BUS_FACTOR_SCORE: 0, RESPONSIVE_MAINTAINER_SCORE: 0, LICENSE_SCORE: 0 });
});

test('FindOtherModules should find other modules correctly', () => {
    const urls = [
        'https://github.com/cloudinary/cloudinary_npm', 
        'other1.com',
        'https://www.npmjs.com/package/express',
        'https://www.npmjs.com/package/browserify', 
        'other2.com'
    ];
    const result = FindOtherModules(urls);

    expect(result).toHaveLength(2);
    expect(result).toContainEqual({ URL: 'other1.com', NET_SCORE: 0, RAMP_UP_SCORE: 0, CORRECTNESS_SCORE: 0, BUS_FACTOR_SCORE: 0, RESPONSIVE_MAINTAINER_SCORE: 0, LICENSE_SCORE: 0 });
    expect(result).toContainEqual({ URL: 'other2.com', NET_SCORE: 0, RAMP_UP_SCORE: 0, CORRECTNESS_SCORE: 0, BUS_FACTOR_SCORE: 0, RESPONSIVE_MAINTAINER_SCORE: 0, LICENSE_SCORE: 0 });
});

// test('GenerateOutput should generate output correctly', () => {
//     // Mock the ndjson.stringify function
//     const originalNdjsonStringify = require('ndjson').stringify;
//     const mockNdjsonStringify = jest.fn();
//     require('ndjson').stringify = mockNdjsonStringify;

//     // Call GenerateOutput with module data
//     const moduleData = {
//         URL: 'github.com/test-repo',
//         NET_SCORE: 0.75,
//         RAMP_UP_SCORE: 0.8,
//         CORRECTNESS_SCORE: 0.9,
//         BUS_FACTOR_SCORE: 0.7,
//         RESPONSIVE_MAINTAINER_SCORE: 0.85,
//         LICENSE_SCORE: 1,
//     };
//     GenerateOutput(moduleData);

//     // Check that ndjson.stringify was called correctly
//     expect(mockNdjsonStringify).toHaveBeenCalledWith();
//     // expect(mockNdjsonStringify().pipe).toHaveBeenCalledWith(process.stdout);
//     // expect(mockNdjsonStringify().write).toHaveBeenCalledWith(moduleData);
//     // expect(mockNdjsonStringify().end).toHaveBeenCalledWith();

//     // Restore the original ndjson.stringify function
//     require('ndjson').stringify = originalNdjsonStringify;
// });