import { module, GenerateOutput } from './fileio';
import { logger } from './logging_cfg';
import { API } from './server';
import path from 'path';
import * as fs from 'fs';
// import { Octokit } from "@octokit/rest";  // GitHub API client
// import { createTokenAuth } from "@octokit/auth-token";  // if using token authentication
import dotenv from 'dotenv';
import { error } from 'winston';
dotenv.config();



// object to hold raw data for each module
export type data = {
    dependencies: any,                  // object of dependencies and their versions
    contrubtorMostPullRequests: number, // Most active contributor's pull requests in past year, number
    totalPullRequests: number,          // All pull requests in the last year, number
    reviewedPullRequests: number, //new
    totalCodeChanges: number, //new
    reviewedCodeChanges: number, //new 
    activeContributors: number,         // Number of active contributors in the past year, number
    totalClosedIssues: number,          // number of total closed issues, number
    totalissues: number,                // number of total issues, number
    totalClosedIssuesMonth: number,     // number of closed issues in the last month, number
    totalIssuesMonth: number,           // number of issues in the last month, number
    quickStart: number,                 // existence of quickStart in README (0 for doesn't exist, 1 for exists)
    examples: number,                   // existence of examples in README (0 for doesn't exist, 1 for exists)
    usage: number,                       // existance of usage section in README (0 for doesn't exist, 1 for exists)
    closedIssues: number,               // number of closed issues in past 2 weeks, number
    openIssues: number,                 // number of open issues, number
    license: string,                 // string of licenses for module and dependencies
    
    
}

// bus factor caclulation
// input: raw data from REST API call
// output: number from bus factor calculation [0, 1]
export function BusFactor(rawData: data): number {
    logger.log('info', 'Calculating Bus Factor');
    // check inputs for divide by 0
    if(rawData.totalPullRequests <= 0) {
        logger.log('debug', 'total pull requests 0')
        return 0;
    }

    let scaleFactor: number = Math.min(1, (rawData.activeContributors / 20));
    let busFactor: number = 1 - (scaleFactor * rawData.contrubtorMostPullRequests / rawData.totalPullRequests);
    return busFactor;
}

// correctness calculation
// input: raw data from REST API call
// output: number from CORRECTNESS_SCORE calculation [0, 1]
export function Correctness(rawData: data): number {
    logger.log('info', 'Calculating Correctness');
    // check inputs for divide by 0
    if(rawData.totalissues <= 0 || rawData.totalIssuesMonth <= 0) {
        logger.log('debug', 'Total issues or total issues this month 0');
        return 0;
    }

    let totalRatio: number = rawData.totalClosedIssues / rawData.totalissues;
    let monthRatio: number = rawData.totalClosedIssuesMonth / rawData.totalIssuesMonth;
    return Math.min(totalRatio, monthRatio);
}

// ramp up calculation
// input: raw data from REST API call
// output: number from ramp up calculation [0, 1]
export function RampUp(rawData: data): number {
    if(rawData.quickStart < 0 || rawData.examples < 0 || rawData.usage < 0) {
        return 0;
    }
    logger.log('info', 'Calculating Ramp Up');
    return (0.5 * rawData.quickStart) + (0.25 * rawData.examples) + (0.25 * rawData.usage);
}

// responsive maintainer calculation
// input: raw data from REST API call
// output: number from responsive maintainer calculation [0, 1]
export function ResponsiveMaintainer(rawData: data): number {
    logger.log('debug', 'Responsive Maintainer');
    // check inputs for divide by 0 or -1
    if(rawData.openIssues == 0) {
        return 1;
    } else if(rawData.openIssues < 0) {
        return 0;
    }

    let issueRatio = rawData.closedIssues / rawData.openIssues;
    return Math.min(issueRatio, 1);
}

// license calculation
// input: raw data from REST API call
// output: number from license calculation [0, 1]
export function License(rawData: data): number {
    logger.log('info', 'Calculating License');
    // check license
    if(rawData.license != '') {
        return 1;
    } else {
        return 0;
    }
}

// net score calculation
// input: module with data from other metric calculations
// output: number from net score calculation [0, 1]
export function NetScore(module: module): number {
    logger.log('info', 'Calculating Net Score');
    // calculate net score
    return ((0.3 * module.BUS_FACTOR_SCORE) + (0.25 * module.CORRECTNESS_SCORE) + (0.15 * module.RAMP_UP_SCORE) + (0.3 * module.RESPONSIVE_MAINTAINER_SCORE))
            * (module.LICENSE_SCORE);
}

// new development - handle one function at once in async function
// input: module with URL filled in
// output: module with all fields filled in
export async function GenerateCalculations(currModule: module, npmFlag: boolean) {
    logger.log('info', 'Working on link: ' + currModule.URL);
    // call API for given module
    //const response = Promise.resolve(API(currModule.URL, npmFlag));
    //response.then((data) => {
    try{
        const rawData = await API(currModule.URL, npmFlag);    
        //let rawData = data;
        logger.log('debug', 'Raw data for calculation from API: ' + JSON.stringify(rawData));
        // calculate each metric and update module object, round to 5 decimal places
        currModule.BUS_FACTOR_SCORE = +BusFactor(rawData).toFixed(5);
        logger.log('debug', 'Calculated BUS_FACTOR_SCORE: ' + currModule.BUS_FACTOR_SCORE);
        currModule.CORRECTNESS_SCORE = +Correctness(rawData).toFixed(5);
        logger.log('debug', 'Calculated CORRECTNESS SCORE: ' + currModule.CORRECTNESS_SCORE);
        currModule.RAMP_UP_SCORE = +RampUp(rawData).toFixed(5);
        logger.log('debug', 'Calculated RAMP UP SCORE: ' + currModule.RAMP_UP_SCORE);
        currModule.RESPONSIVE_MAINTAINER_SCORE = +ResponsiveMaintainer(rawData).toFixed(5);
        logger.log('debug', 'Calculated RESPONSIVE MAINTAINER SCORE: ' + currModule.RESPONSIVE_MAINTAINER_SCORE);
        currModule.LICENSE_SCORE = +License(rawData).toFixed(5);
        logger.log('debug', 'Calculated LICENSE SCORE: ' + currModule.LICENSE_SCORE);
        currModule.NET_SCORE = +NetScore(currModule).toFixed(5);
        logger.log('debug', 'Calculated NET_SCORE: ' + currModule.NET_SCORE);
        
        //const dependencyPinningScore = calculateDependencyPinning();
        currModule.DEPENDENCY_PINNING_SCORE = +calculateDependencyPinningScore(rawData).toFixed(5);
        logger.log('debug', 'Calculated DEPENDENCY_PINNING_SCORE: ' + currModule.DEPENDENCY_PINNING_SCORE);

        currModule.CODE_REVIEW_COVERAGE_SCORE = +calculateCodeReviewCoverageScore(rawData).toFixed(5);
        logger.log('debug', 'Calculated CODE_REVIEW_COVERAGE_SCORE: ' + currModule.CODE_REVIEW_COVERAGE_SCORE);

        logger.log('info', 'Completed calculation for module: ' + currModule.URL);

    

        if (rawData.contrubtorMostPullRequests == -1) {
            currModule.BUS_FACTOR_SCORE = 0;
            currModule.CORRECTNESS_SCORE = 0;
            currModule.RAMP_UP_SCORE = 0;
            currModule.RESPONSIVE_MAINTAINER_SCORE = 0;
            currModule.LICENSE_SCORE = 0;
            currModule.NET_SCORE = 0;
            currModule.DEPENDENCY_PINNING_SCORE = 0;
            currModule.CODE_REVIEW_COVERAGE_SCORE = 0;
        }
        
        GenerateOutput(currModule);
    } catch (err){
        logger.log('error', 'Error in API call or during calculations: ' + err);
        currModule.BUS_FACTOR_SCORE = 0;
        currModule.CORRECTNESS_SCORE = 0;
        currModule.RAMP_UP_SCORE = 0;
        currModule.RESPONSIVE_MAINTAINER_SCORE = 0;            
        currModule.LICENSE_SCORE = 0;
        currModule.NET_SCORE = 0;
        currModule.DEPENDENCY_PINNING_SCORE = 0;
        currModule.CODE_REVIEW_COVERAGE_SCORE = 0;
        GenerateOutput(currModule);
    }
    // response.catch((err) => {
    //     logger.log('info', 'Error in API call: ' + err);
    //     // For example, you might want to set it to a default value.
    //     currModule.DEPENDENCY_PINNING_SCORE = 0;
    //     GenerateOutput(currModule);
    // });
}




// Function to calculate the dependency pinning score

export function calculateDependencyPinningScore(rawData: data): number {
    try {
        const dependencies = rawData.dependencies;

        // console.log('Raw dependencies:', dependencies);

        let pinnedCount = 0;

        // Check each dependency to see if it's pinned to a specific major+minor version
        for (const [dep, version] of Object.entries(dependencies)) {
            // Regex to check if the version is pinned (e.g., "2.3.x", "2.3.*", "2.3.X" are considered pinned)
            if (typeof version === 'string' && /^\d+\.\d+(\.[xX*]|\.\d+)?$/.test(version)) {
                pinnedCount++;
            }
        }

        // console.log('Pinned dependencies:', pinnedCount);

        // Calculate the score
        const totalDependencies = Object.keys(dependencies).length;
        const score = totalDependencies > 0 ? pinnedCount / totalDependencies : 1.0;

        // console.log('Dependency pinning score:', score);

        return score;
    } catch (error) {
        console.error('Error calculating dependency pinning score:', error);
        return 0; // Consider appropriate error handling
    }
}


export function calculateCodeReviewCoverageScore(rawData: any): number {
    try {
        // Log raw data to check its structure
        // console.log('Raw data:', rawData);

        const totalPullRequests = rawData.totalPullRequests;
        const reviewedPullRequests = rawData.reviewedPullRequests;
        const totalCodeChanges = rawData.totalCodeChanges;
        const reviewedCodeChanges = rawData.reviewedCodeChanges;

        // Check for division by zero
        if (totalPullRequests === 0 || totalCodeChanges === 0) {
            throw new Error('Division by zero condition');
        }

        const prCoverage = reviewedPullRequests / totalPullRequests;
        const codeCoverage = reviewedCodeChanges / totalCodeChanges;

        const reviewCoverageScore = (prCoverage + codeCoverage) / 2;

        // Log the result before returning
        console.log('Review coverage score:', reviewCoverageScore);

        return reviewCoverageScore;
    } catch (error) {
        console.error("Error calculating code review coverage score:", error);
        // Rethrow or handle the error appropriately
        throw error;  // This will ensure the error is visible outside the function
    }
}


// use the script when no main module
if (require.main === module) {
    // Read the command line arguments
    const args = process.argv.slice(2);
    if (args.length !== 1) {
        console.error('Usage: node calculations.js <module>');
        process.exit(1);
    }
    const module = args[0];
    console.log('Calculating metrics for module:', module);

    // Call the function

    const currModule: module = {
        URL: module,
        BUS_FACTOR_SCORE: 0,
        CORRECTNESS_SCORE: 0,
        RAMP_UP_SCORE: 0,
        RESPONSIVE_MAINTAINER_SCORE: 0,
        LICENSE_SCORE: 0,
        NET_SCORE: 0,
        DEPENDENCY_PINNING_SCORE: 0,
        CODE_REVIEW_COVERAGE_SCORE: 0,
    };

    // GenerateCalculations(currModule, false);


}

