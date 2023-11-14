// Imports
import { data } from './calculations';
import { fetch_METRICS, getLink, convertLink } from './fetch';
import { ReadMeExtractor, DependenciesExtractor } from './github-readme-extractor'
import { logger } from './logging_cfg'

// If there's a link for a npm package, set the flag to true and add the link
export async function API(link: string, npmFlag: boolean): Promise<data> {
    try {
        if (npmFlag) { 
            link = await Promise.resolve(getLink(link));   // Calling the getLink function to get the GitHub API link
        }

    const githubApiLink: string = convertLink(link);

    let rawData: data = { dependencies:{}, contrubtorMostPullRequests: 0, totalPullRequests: 0, reviewedPullRequests: 0,totalCodeChanges: 0, reviewedCodeChanges: 0, activeContributors: 0,
        totalClosedIssues: 0, totalissues: 0, totalClosedIssuesMonth: 0, totalIssuesMonth: 0,
        quickStart: 0, examples: 0, usage: 0, closedIssues: 0, openIssues: 0, license: ''};
    
    // Link for any repo
    const userData = await fetch_METRICS(githubApiLink);

    // get readme data
    const response = await ReadMeExtractor(link);
    if(response) {
        rawData.quickStart = response[0];
        rawData.examples = response[1];
        rawData.usage = response[2];
        rawData.license = response[3];
    } else {
        logger.log('info', 'Failed to fetch readme data');
    }

    const response2 = await DependenciesExtractor(link);

    if(response) {
        rawData.dependencies = response2;
    } else {
        logger.log('info', 'Failed to fetch readme data');
    }

    // Printing the results of fetch_METRIC_1
    if (userData) {
        logger.log('info', 'Fetched Github user data');
        rawData.contrubtorMostPullRequests = userData.mostPulls365;
        rawData.totalPullRequests = userData.totalPulls365;
        rawData.activeContributors = userData.totalPullers365;
        rawData.totalClosedIssues = userData.issuesClosed;
        rawData.totalissues = userData.issuesTotal;
        rawData.totalClosedIssuesMonth = userData.issuesClosed30;
        rawData.totalIssuesMonth = userData.issuesTotal30;
        rawData.closedIssues = userData.issuesClosed14;
        rawData.openIssues = userData.issuesOpen;
        rawData.totalPullRequests = userData.totalPullRequests;
        rawData.totalCodeChanges = userData.totalCodeChanges;
        rawData.reviewedPullRequests = userData.reviewedPullRequests;
        rawData.reviewedCodeChanges = userData.reviewedCodeChanges;
        //rawData.fractionDependenciesPinned = userData.fractionDependenciesPinned; // new metric
        //rawData.fractionCodeIntroducedReviewed = userData.fractionCodeIntroducedReviewed;

    } else {
        logger.log('info', 'Failed to fetch GitHub user data');        
    }

    return rawData;
} catch (error) {
    logger.log('info', 'An error occurred:' + error);
    return { dependencies:{}, contrubtorMostPullRequests: 0, totalPullRequests: 0, reviewedPullRequests: 0,totalCodeChanges: 0, reviewedCodeChanges: 0, activeContributors: 0, totalClosedIssues: 0, totalissues: 0, totalClosedIssuesMonth: 0, totalIssuesMonth: 0, quickStart: 0, examples: 0, usage: 0, closedIssues: 0, openIssues: 0, license: ''
}
}
}
