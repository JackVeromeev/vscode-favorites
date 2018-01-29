import * as vscode from 'vscode'

import { Resource, FavoritesProvider } from '../provider/FavoritesProvider'
import configMgr from '../helper/configMgr'

export function moveUp(favoritesProvider: FavoritesProvider) {
  return vscode.commands.registerCommand('favorites.moveUp', async function(value: Resource) {
    const config = vscode.workspace.getConfiguration('favorites')

    const items = await favoritesProvider.getChildren()

    const currentIndex = items.findIndex(i => i.value === value.value)
    if (currentIndex === 0) {
      return
    }

    const resources: Array<string> = []

    for (let i = 0; i < items.length; i++) {
      if (i === currentIndex - 1) {
        resources.push(value.value)
        continue
      }
      if (i === currentIndex) {
        resources.push(items[i - 1].value)
        continue
      }
      resources.push(items[i].value)
    }

    config.update('sortOrder', 'MANUAL', false)
    configMgr.save('resources', resources).catch(console.warn)
  })
}
