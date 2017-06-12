import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

import { FileStat } from '../enum';
import { Item } from '../model';

export class FavoritesProvider implements vscode.TreeDataProvider<Resource> {


    private _onDidChangeTreeData: vscode.EventEmitter<Resource | undefined> = new vscode.EventEmitter<Resource | undefined>();
    readonly onDidChangeTreeData: vscode.Event<Resource | undefined> = this._onDidChangeTreeData.event;

    constructor(private workspaceRoot: string) {
    }

    refresh(): void {
        this._onDidChangeTreeData.fire();
    }

    getTreeItem(element: Resource): vscode.TreeItem {
        return element;
    }

    getChildren(element?: Resource): Thenable<Resource[]> {

        const resources = this.getFavoriteResources();
        if (!resources || !resources.length) {
            return Promise.resolve([]);
        }

        if (!element) {
            return Promise
                .all(resources.map(r => this.getResourceStat(r)))
                .then((data: Array<Item>) => {
                    return data.filter(i => i.stat !== FileStat.NEITHER);
                })
                .then((data: Array<Item>) => this.data2Resource(data, 'resource'));
        }

        return this.getChildrenResources(element.value);
    }

    private getChildrenResources(filePath: string): Thenable<Array<Resource>> {

        return new Promise<Array<Resource>>((resolve, reject) => {
            fs.readdir(path.resolve(this.workspaceRoot, filePath), (err, files) => {
                if (err) {
                    return resolve([]);
                }

                Promise
                    .all(files.map(f => this.getResourceStat(path.join(filePath, f))))
                    .then((data: Array<Item>) => this.data2Resource(data, 'resourceChild'))
                    .then(resolve);
            });
        });
    }

    private getFavoriteResources(): Array<string> {
        return <Array<string>>vscode.workspace.getConfiguration('favorites').get('resources');
    }

    private getResourceStat(filePath: string): Thenable<Item> {
        return new Promise(resolve => {
            fs.stat(path.resolve(this.workspaceRoot, filePath), (err, stat: fs.Stats) => {
                if (err) {
                    return resolve({
                        filePath,
                        stat: FileStat.NEITHER
                    });
                }
                if (stat.isDirectory()) {
                    return resolve({
                        filePath,
                        stat: FileStat.DIRECTORY
                    });
                }
                if (stat.isFile()) {
                    return resolve({
                        filePath,
                        stat: FileStat.FILE
                    });
                }
                return resolve({
                    filePath,
                    stat: FileStat.NEITHER
                });
            });
        });
    }

    private data2Resource(data: Array<Item>, contextValue: string): Array<Resource> {
        return data.map(i => {
            if (i.stat === FileStat.DIRECTORY) {
                return new Resource(path.basename(i.filePath), vscode.TreeItemCollapsibleState.Collapsed, i.filePath, contextValue);
            }
            return new Resource(path.basename(i.filePath), vscode.TreeItemCollapsibleState.None, i.filePath, contextValue, {
                command: 'vscode.open',
                title: '',
                arguments: [vscode.Uri.parse(`file://${path.resolve(this.workspaceRoot, i.filePath)}`)],
            });
        });
    }
}

export class Resource extends vscode.TreeItem {

    constructor(public label: string, public collapsibleState: vscode.TreeItemCollapsibleState, public value: string, public contextValue: string, public command?: vscode.Command) {
        super(label, collapsibleState);
    }

}