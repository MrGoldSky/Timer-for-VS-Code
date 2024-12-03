import * as vscode from 'vscode';

let timerInterval: NodeJS.Timeout | undefined;
let elapsedSeconds = 0;
let isPaused = true;

interface ProjectStat {
    date: string;
    projectName: string;
    timeSpent: number;
}

const stats: ProjectStat[] = [];

const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

const updateStatusBar = (
    timerItem: vscode.StatusBarItem,
    startButton: vscode.StatusBarItem,
    pauseButton: vscode.StatusBarItem,
    resetButton: vscode.StatusBarItem
) => {
    timerItem.text = `$(clock) ${formatTime(elapsedSeconds)}`;
    timerItem.show();

    if (isPaused) {
        startButton.show();
        pauseButton.hide();
    } else {
        startButton.hide();
        pauseButton.show();
    }

    resetButton.show();
};

export function activate(context: vscode.ExtensionContext) {
    const timerItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
    const startButton = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 99);
    const pauseButton = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 98);
    const resetButton = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 97);

    startButton.text = '$(triangle-right) Start';
    pauseButton.text = '$(debug-pause) Pause';
    resetButton.text = '$(trash) Reset';

    startButton.command = 'project-timer.start';
    pauseButton.command = 'project-timer.pause';
    resetButton.command = 'project-timer.reset';

    context.subscriptions.push(
        vscode.commands.registerCommand('project-timer.start', () => {
            if (!isPaused) return;
            isPaused = false;
            timerInterval = setInterval(() => {
                elapsedSeconds++;
                updateStatusBar(timerItem, startButton, pauseButton, resetButton);
            }, 1000);
            updateStatusBar(timerItem, startButton, pauseButton, resetButton);
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('project-timer.pause', () => {
            if (isPaused) return;
            isPaused = true;
            if (timerInterval) {
                clearInterval(timerInterval);
            }

            const workspaceName = vscode.workspace.name || 'Unknown Project';
            const date = new Date().toLocaleDateString();
            stats.push({ date, projectName: workspaceName, timeSpent: elapsedSeconds });

            updateStatusBar(timerItem, startButton, pauseButton, resetButton);
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('project-timer.reset', () => {
            elapsedSeconds = 0;
            if (isPaused) {
                updateStatusBar(timerItem, startButton, pauseButton, resetButton);
            } else {
                vscode.commands.executeCommand('project-timer.pause').then(() => {
                    updateStatusBar(timerItem, startButton, pauseButton, resetButton);
                });
            }
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('project-timer.showStats', () => {
            const statStrings = stats.map(
                (stat) => `${stat.date} - ${stat.projectName}: ${formatTime(stat.timeSpent)}`
            );

            vscode.window.showInformationMessage(statStrings.join('\n') || 'No statistics available.');
        })
    );

    context.subscriptions.push(timerItem, startButton, pauseButton, resetButton);

    updateStatusBar(timerItem, startButton, pauseButton, resetButton);
}
