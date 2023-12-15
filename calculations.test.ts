import { module } from './fileio';
import { data, BusFactor, Correctness, RampUp, ResponsiveMaintainer, License, NetScore } from './calculations';

// should return 0 is totalPullRequests is 0
test('BusFactor0', () => {
    const rawData: data = {
        contrubtorMostPullRequests: 10,
        totalPullRequests: 0,
        activeContributors: 5,
        totalClosedIssues: 20,
        totalissues: 50,
        totalClosedIssuesMonth: 5,
        totalIssuesMonth: 10,
        quickStart: 1,
        examples: 1,
        usage: 1,
        closedIssues: 5,
        openIssues: 10,
        license: 'License1',
    };

    const result = BusFactor(rawData);

    expect(result).toBe(0);
});

// should calculate bus factor correclty
test('BusFactorSuccess', () => {
    const rawData: data = {
        contrubtorMostPullRequests: 10,
        totalPullRequests: 100,
        activeContributors: 5,
        totalClosedIssues: 20,
        totalissues: 0,
        totalClosedIssuesMonth: 5,
        totalIssuesMonth: 10,
        quickStart: 1,
        examples: 1,
        usage: 1,
        closedIssues: 5,
        openIssues: 10,
        license: 'License1',      
    };

    const result = BusFactor(rawData);

    expect(result).toBe(0.975);
});

// should return 0 if totalissues is 0
test('Correctness0', () => {
    const rawData: data = {
        contrubtorMostPullRequests: 10,
        totalPullRequests: 100,
        activeContributors: 5,
        totalClosedIssues: 20,
        totalissues: 0,
        totalClosedIssuesMonth: 5,
        totalIssuesMonth: 10,
        quickStart: 1,
        examples: 1,
        usage: 1,
        closedIssues: 5,
        openIssues: 10,
        license: 'License1',      
    };

    const result = Correctness(rawData);

    expect(result).toBe(0);
});
  
// should calculate correctness correctly
test('CorrectnessSuccess', () => {
    const rawData: data = {
        contrubtorMostPullRequests: 10,
        totalPullRequests: 100,
        activeContributors: 5,
        totalClosedIssues: 20,
        totalissues: 50,
        totalClosedIssuesMonth: 5,
        totalIssuesMonth: 10,
        quickStart: 1,
        examples: 1,
        usage: 1,
        closedIssues: 5,
        openIssues: 10,
        license: 'License1',      
    };

    const result = Correctness(rawData);

    expect(result).toBe(0.4);
});
  
// should return 1
test('RampUp', () => {
    const rawData: data = {
        contrubtorMostPullRequests: 10,
        totalPullRequests: 100,
        activeContributors: 5,
        totalClosedIssues: 20,
        totalissues: 50,
        totalClosedIssuesMonth: 5,
        totalIssuesMonth: 10,
        quickStart: 1,
        examples: 1,
        usage: 1,
        closedIssues: 5,
        openIssues: 10,
        license: 'License1',
    };

    const result = RampUp(rawData);

    expect(result).toBe(1);
});

// should return 1 if openIssues is 0
test('ResponsiveMaintainer0', () => {
    const rawData: data = {
        contrubtorMostPullRequests: 10,
        totalPullRequests: 100,
        activeContributors: 5,
        totalClosedIssues: 20,
        totalissues: 50,
        totalClosedIssuesMonth: 5,
        totalIssuesMonth: 10,
        quickStart: 1,
        examples: 1,
        usage: 1,
        closedIssues: 5,
        openIssues: 0,
        license: 'License1',
    };

    const result = ResponsiveMaintainer(rawData);

    expect(result).toBe(1);
});

test('ResponsiveMaintainerSuccess', () => {
    const rawData: data = {
        contrubtorMostPullRequests: 10,
        totalPullRequests: 100,
        activeContributors: 5,
        totalClosedIssues: 20,
        totalissues: 0,
        totalClosedIssuesMonth: 5,
        totalIssuesMonth: 10,
        quickStart: 1,
        examples: 1,
        usage: 1,
        closedIssues: 5,
        openIssues: 10,
        license: 'License1',      
    };

    const result = ResponsiveMaintainer(rawData);

    expect(result).toBe(0.5);
});
  
// should return 1 if all license are "GNU Lesser General Public License, version 2.1
test('License1', () => {
    const rawData: data = {
            contrubtorMostPullRequests: 10,
            totalPullRequests: 100,
            activeContributors: 5,
            totalClosedIssues: 20,
            totalissues: 50,
            totalClosedIssuesMonth: 5,
            totalIssuesMonth: 10,
            quickStart: 1,
            examples: 1,
            usage: 1,
            closedIssues: 5,
            openIssues: 10,
            license: 'GNU Lesser General Public License, version 2.1',
    };

    const result = License(rawData);

    expect(result).toBe(1);
});
  
//should return 0 if all license are "GNU Lesser General Public License, version 2.1
test('License0', () => {
    const rawData: data = {
        contrubtorMostPullRequests: 10,
        totalPullRequests: 100,
        activeContributors: 5,
        totalClosedIssues: 20,
        totalissues: 50,
        totalClosedIssuesMonth: 5,
        totalIssuesMonth: 10,
        quickStart: 1,
        examples: 1,
        usage: 1,
        closedIssues: 5,
        openIssues: 10,
        license: '',
    };

    const result = License(rawData);

    expect(result).toBe(0);
});
  
// should calculate net score correctly
test('NetScore0', () => {
    const moduleData: module = {
        URL: 'github.com/example',
        NET_SCORE: 0,
        RAMP_UP_SCORE: 1,
        CORRECTNESS_SCORE: 0.4,
        BUS_FACTOR_SCORE: 0.975,
        RESPONSIVE_MAINTAINER_SCORE: 0.5,
        LICENSE_SCORE: 0,
    };

    const result = NetScore(moduleData);
    expect(result).toBe(0);
});

test('NetScoreSuccess', () => {
    const moduleData: module = {
        URL: 'github.com/example',
        NET_SCORE: 0,
        RAMP_UP_SCORE: 1,
        CORRECTNESS_SCORE: 0.4,
        BUS_FACTOR_SCORE: 0.975,
        RESPONSIVE_MAINTAINER_SCORE: 0.5,
        LICENSE_SCORE: 1,
    };

    const result = NetScore(moduleData);
    expect(result).toBe(0.6925);
});