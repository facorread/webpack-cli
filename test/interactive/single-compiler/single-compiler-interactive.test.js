'use strict';
const { runAndGetWatchProc } = require('../../utils/test-utils');
const { writeFileSync } = require('fs');
const { resolve } = require('path');
const { version } = require('webpack');

const wordsInStatsv4 = ['Hash', 'Version', 'Time', 'Built at:', 'main.js'];
const wordsInStatsv5 = ['asset', 'index.js', 'compiled successfully'];

describe('--interactive flag with single compiler', () => {
    it('should output in interactive with --watch and --interactive', (done) => {
        const proc = runAndGetWatchProc(__dirname, ['--watch', '--interactive'], false, '', true);
        let semaphore = 2;
        const clear = '\x1B[2J\x1B[3J\x1B[H';
        proc.stdout.on('data', (chunk) => {
            const data = chunk.toString();
            if (semaphore === 2 && data.includes('\u2B24')) {
                writeFileSync(resolve(__dirname, './src/index.js'), `console.log('I am Batman');`);
                semaphore--;
                return;
            }
            if (semaphore === 1) {
                expect(data).toBe(clear);
                semaphore--;
                return;
            }
            if (semaphore === 0) {
                if (version.startsWith('5')) {
                    for (const word of wordsInStatsv5) {
                        expect(data).toContain(word);
                    }
                } else {
                    for (const word of wordsInStatsv4) {
                        expect(data).toContain(word);
                    }
                }
                semaphore--;
                proc.kill();
                done();
                return;
            }
        });
    });

    it('should output in standard with --watch only', (done) => {
        const proc = runAndGetWatchProc(__dirname, ['--watch'], false, '', true);
        let semaphore = 1;
        proc.stdout.on('data', (chunk) => {
            const data = chunk.toString();
            if (semaphore === 1 && data.includes('watching files for updates')) {
                writeFileSync(resolve(__dirname, './src/index.js'), `console.log('I am Batman');`);
                semaphore--;
                return;
            }
            if (semaphore === 0) {
                if (version.startsWith('5')) {
                    for (const word of wordsInStatsv5) {
                        expect(data).toContain(word);
                    }
                } else {
                    for (const word of wordsInStatsv4) {
                        expect(data).toContain(word);
                    }
                }
                semaphore--;
                proc.kill();
                done();
                return;
            }
        });
    });
});