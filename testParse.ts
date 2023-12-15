import * as fs from 'fs';
import { logger } from './logging_cfg';

let exitValue = 1;

// parse output from tests for output
try {
    // get data for number of tests performed
    const test = fs.readFileSync('tests.json', 'utf-8');
    // get coverage data
    const coverage = fs.readFileSync('coverage/coverage-summary.json', 'utf-8');
    // check if data could be retrieved
    if(test && coverage) {
        // parse data and generate output
        const parsedTest = JSON.parse(test);
        const parsedCoverage = JSON.parse(coverage);
        let lineCoverage: number = (parsedCoverage.total.lines.pct).toFixed(0);
        process.stdout.write(`${parsedTest.numPassedTests}/${parsedTest.numTotalTests} test cases passed. ${lineCoverage}% line coverage achieved.`);
        
        logger.log('debug', `${parsedTest.numPassedTests}/${parsedTest.numTotalTests} test cases passed.`);
        logger.log('debug', `${parsedCoverage.total.lines.pct}% line coverage achieved.`);
        logger.log('info', 'Retrieved data from tests');
    }
    else {
        logger.log('debug', 'Test data could not be collected');
    }

    // remove coverage folder
    fs.rm('coverage', { recursive: true }, (err) => {
        if(err) {
            // File deletion failed
            logger.log('debug', "Couldn't delete coverage directory");
        }
    });
    // remove tests.json file
    fs.rm('tests.json', (err) => {
        if(err) {
            // File deletion failed
            logger.log('debug', "Couldn't delete tests.json");
        }
    }); 
}

// Tests were not performed
catch(err) {
    process.stdout.write('Test suite was not executed');
    logger.log('info', 'Test suite was not executed');
}