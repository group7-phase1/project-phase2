import { ReadMeExtractor } from './github-readme-extractor';
import * as fs from 'fs';
import * as git from 'isomorphic-git';
import http from 'isomorphic-git/http/node';
import { logger } from './logging_cfg';


test('should extract the readme and then output array correctly', async () => {
    const gitHubLink = 'https://github.com/expressjs/express';
    const result = await ReadMeExtractor(gitHubLink);

    expect(result).toStrictEqual([1, 1, 1, "MIT"]);
 
}, 10000);

test('should extract the readme and then output array correctly', async () => {
    const gitHubLink = 'https://github.com/bhatnag8/Radiant';
    const result = await ReadMeExtractor(gitHubLink);

    expect(result).toStrictEqual([0, 0, 0, ""]);

});