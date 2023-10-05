import * as fs from 'fs';
import * as git from 'isomorphic-git';
import http from 'isomorphic-git/http/node';
import { logger } from './logging_cfg';

//const githubRepoUrl = 'https://github.com/lodash/lodash'; // Replace with the actual GitHub repository URL

export async function ReadMeExtractor(githubRepoUrl: string): Promise<[number, number, number, string]> {
  const localRepoPath = './local-repo'; // Specify the path where you want to clone the repository
  try {
    // Check if the local directory exists already
    const localRepoExists = fs.existsSync(localRepoPath);

    // If it exists, delete it first
    if (localRepoExists) {
      fs.rm(localRepoPath, { recursive: true }, (err) => {
        if(err){
            // File deletion failed
            logger.log('info', err.message);
            return;
        }
        logger.log('info', "Cloned local repo deleted successfully");
      })};

    // Clone the repository
    logger.log('info', 'Cloning repository...');
    await git.clone({
      fs,
      http,
      dir: localRepoPath,
      url: githubRepoUrl,
      singleBranch: true, // Only clone the default branch
    });

    // Read the README file - case insensitive
    const filesInRepo = fs.readdirSync(localRepoPath);
    const readMe = filesInRepo.find((item) => item.toLowerCase() === 'readme.md');
    // make sure file exists
    if(!readMe) {
      logger.log('info', 'no README file found');
      return [0, 0, 0, ''];
    }

    // get path to readme file then extract constant
    const readmePath = `${localRepoPath}/${readMe}`;
    const readmeContent = fs.readFileSync(readmePath, 'utf-8');

    // Extract information
    const quickStartFound: number = checkQuickStart(readmeContent);
    const examplesFound: number = checkExamples(readmeContent);
    const usageFound: number = checkUsage(readmeContent);
    const license: string = checkLicense(readmeContent);

    logger.log('info', 'Readme data gathered for ' + githubRepoUrl);
    logger.log('debug', 'Quick Start: ' + quickStartFound);
    logger.log('debug', 'Examples: ' + examplesFound);
    logger.log('debug', 'Usage: ' + usageFound);
    logger.log('debug', 'License: ' + license);
    deletePath(localRepoPath);
    return [quickStartFound, examplesFound, usageFound, license];

  } catch (error) {
    logger.log('info', 'An error occurred:' + error);
    deletePath(localRepoPath);
    return [0, 0, 0, ''];
  }
}

function deletePath(localRepoPath: string) {
  // Delete the local repository
  logger.log('debug', `Deleting ${localRepoPath}...`);
  fs.rm(localRepoPath, { recursive: true }, (err) => {
    if(err){
        // File deletion failed
        logger.log('info', err.message);
        return;
    }
  });
  logger.log('info', "File deleted successfully");
}

function checkQuickStart(content: string): number {
  // Check for common quick start phrases and an "Installation" section
  const quickStartKeywords = ['npm install', 'yarn add', 'getting started', 'setup', 'installation', 'install'];
    for (const keyword of quickStartKeywords) {
        if (content.toLowerCase().includes(keyword)) {
            return 1;
        }
    }
    const installationSectionHeading = '## Installation'; // Assuming "## Installation" as the heading for Installation section
    if (content.includes(installationSectionHeading)){
        return 1;
    };
    
    return 0;
}

function checkExamples(content: string): number {
  // Check for keywords related to examples
  const examplesKeywords = ['example', 'sample', 'demo', 'use case', 'examples'];
    for (const keyword of examplesKeywords) {
        if (content.toLowerCase().includes(keyword)) {
            return 1;
        }
    }
    const examplesSectionHeading = '## Examples'; // Assuming "## Examples" as the heading for Examples section
    if (content.includes(examplesSectionHeading)) {
        return 1;
    }
    
    return 0;
}

function checkUsage(content: string): number {
  // Check for keywords related to usage
  const usageKeywords = ['usage', 'how to use', 'how it works', 'getting started', 'documentation', 'features', 'test'];
    for (const keyword of usageKeywords) {
        if (content.toLowerCase().includes(keyword)) {
            return 1;
        }
    }
    const usageSectionHeading = '## Usage'; // Assuming "## Usage" as the heading for Usage section
    if (content.includes(usageSectionHeading)) {
        return 1;
    }
    
    return 0;
}

function checkLicense(content: string): string {
  logger.log('debug', 'searching for license information');
  
  // check license compatibility
  // reference: https://www.gnu.org/licenses/license-list.en.html#GPLCompatibleLicenses
  const licenseDetection1 = /\b(MIT|Apache|Artistic|Berkely Database|Boost Software|BSD|CeCILL version 2|Cryptix General)\b/i;
  const licenseDetection2 = /\b(Eiffel|EU DataGrid|Expat|Freetype|Intel open source|ISC|Mozilla|SGI Free|ML of New Jersey)\b/i;
  const licenseDetection3 = /\b(Unicode|Universal|W3C|X11|XFree|Zope Public|eCos|Educational|NCSA|OpenLDAP)\b/i;
  const licenseFound1 = content.match(licenseDetection1);
  const licenseFound2 = content.match(licenseDetection2);
  const licenseFound3 = content.match(licenseDetection3);
  
  if (licenseFound1) {
    logger.log('debug', `license matched: ${licenseFound1[0]}`)
    return licenseFound1[0];
  } else if(licenseFound2) {
    logger.log('debug', `license matched: ${licenseFound2[0]}`)
    return licenseFound2[0];
  } else if(licenseFound3) {
    logger.log('debug', `license matched: ${licenseFound3[0]}`)
    return licenseFound3[0];
  } else {
    return '';
  }
}