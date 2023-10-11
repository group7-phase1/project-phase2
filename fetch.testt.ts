import { fetch_METRICS, getLink, convertLink, linkValidator } from './fetch';
import axios from 'axios';

// Mock axios to simulate API responses
//jest.mock('axios');

// fetch_METRICS function
test('should fetch and return MetricData', async () => {
    const apiLink = 'https://api.github.com/repos/cloudinary/cloudinary_npm';
    const result = await fetch_METRICS(apiLink);

    expect(result.totalPullers365).toBeGreaterThanOrEqual(0);
    expect(result.mostPulls365).toBeGreaterThanOrEqual(0);
    expect(result.totalPulls365).toBeGreaterThanOrEqual(0);
    expect(result.issuesClosed).toBeGreaterThanOrEqual(0);
    expect(result.issuesTotal).toBeGreaterThanOrEqual(0);
    expect(result.issuesClosed30).toBeGreaterThanOrEqual(0);
    expect(result.issuesTotal30).toBeGreaterThanOrEqual(0);
    expect(result.issuesClosed14).toBeGreaterThanOrEqual(0);
    expect(result.issuesOpen).toBeGreaterThanOrEqual(0);
}, 15000);

// fetch_METRICS function
test('should fetch and return MetricData for a wrong link', async () => {
    const apiLink = 'https://github.com/bhatnag8/Radiantx';
    const result = await fetch_METRICS(apiLink);

    expect(result.totalPullers365).toEqual(-1);
    expect(result.mostPulls365).toEqual(-1);
    expect(result.totalPulls365).toEqual(-1);
    expect(result.issuesClosed).toEqual(-1);
    expect(result.issuesTotal).toEqual(-1);
    expect(result.issuesClosed30).toEqual(-1);
    expect(result.issuesTotal30).toEqual(-1);
    expect(result.issuesClosed14).toEqual(-1);
    expect(result.issuesOpen).toEqual(-1);
}, 15000);

//getLink function
test('should extract GitHub repository link from npm package page', async () => {
    const npmLink = 'https://www.npmjs.com/package/express';
    const result = await getLink(npmLink);

    expect(result).toBe('https://github.com/expressjs/express');
});

//getLink function
test('should return null when GitHub repository link is not found', async () => {
    const npmLink = 'https://www.npmjs.com/package/swift-api';
    const result = await getLink(npmLink);

    expect(result).toBe(null);
});

// convertLink function
test('should convert a GitHub link to the GitHub API link', () => {
    const githubLink = 'https://github.com/cloudinary/cloudinary_npm';
    const result = convertLink(githubLink);

    expect(result).toBe('https://api.github.com/repos/cloudinary/cloudinary_npm');
});

//linkValidator function
test('should convert a GitHub link to the GitHub API link', async () => {
    const githubLink = 'https://github.com/lodash/lodash';
    const githubLink_invalid = 'https://github.com/lodash/wncpne';
    const valid = await linkValidator(githubLink);
    const invalid = await linkValidator(githubLink_invalid);
    expect(valid).toEqual(200);
    expect(invalid).toEqual(400);
});



