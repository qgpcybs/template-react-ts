import { SceneInfo } from "../api/Scenes";
import { DatabaseManager } from "./DatabaseManger";
import { EventBus } from "../game/EventBus";
export class SceneManager {
    /**
     * (Alias) The table name of scenes
     */
    static TABLENAME = DatabaseManager.TABLENAME_SCENES;

    /**
     * The brief infomation of scenes
     */
    static scenesInfo: SceneInfo[] = [];

    /**
     * [Set] The brief infomation of scenes
     */
    static setScenesInfo: React.Dispatch<React.SetStateAction<SceneInfo[]>>;

    /**
     * Update the brief infomation of scenes
     */
    static updateScenesInfo() {
        const trans = DatabaseManager.indexedDB.transaction(
            [SceneManager.TABLENAME],
            "readonly"
        );
        const table = trans.objectStore(SceneManager.TABLENAME);
        const openCursor = table.openCursor();
        const _scenesInfo: SceneInfo[] = [];
        openCursor.onsuccess = () => {
            const item = openCursor.result;
            if (item) {
                const scnenInfo: SceneInfo = {
                    id: item.primaryKey,
                    name: item.value.name,
                };
                _scenesInfo[item.value.id] = scnenInfo;
                item.continue();
            } else {
                SceneManager.setScenesInfo(_scenesInfo);
                EventBus.emit("editor-init-over");
            }
        };
    }

    /**
     * [Async] Create a new scene
     * The primary key is id
     * @param tilemapName The name of scene
     * @param width The width of scene
     * @param height The height of scene
     */
    static createScene(
        tilemapName: string = "abab",
        width: number = 40,
        height: number = 23
    ) {
        // Create a transaction
        const trans = DatabaseManager.indexedDB.transaction(
            [SceneManager.TABLENAME],
            "readwrite"
        );

        // Get the table
        const table = trans.objectStore(SceneManager.TABLENAME);

        // Iterate over scenes to generate a list of ids
        const ids: boolean[] = [];
        const openCursor = table.openCursor();
        openCursor.onsuccess = () => {
            const item = openCursor.result;
            if (item) {
                // Put existing ids into the array
                ids[Number(item.primaryKey)] = true;
                item.continue();
            } else {
                // Find a new id as key
                let newId: number;
                for (let i = 0; ; i++) {
                    if (ids[i] !== true) {
                        newId = i;
                        break;
                    }
                }

                // Construct the scene data
                const sceneData = {
                    id: newId,
                    name: tilemapName,
                    data: [] as number[][],
                };
                for (let i = 0; i < height; i++) {
                    sceneData.data[i] = [];
                    for (let j = 0; j < width; j++) {
                        sceneData.data[i][j] = 32;
                    }
                }

                // Create the scene by id
                table.add(sceneData);
            }
        };
    }

    static getScenesNumber(): number {
        return 1;
    }

    /**
     * Save the tilemap
     * @param tilemapName the name of the tilemap
     * @param data the tileset data
     */
    static saveTileMap(tilemapName: string, data: string) {
        // Create a transaction
        const trans = DatabaseManager.indexedDB.transaction(
            [SceneManager.TABLENAME],
            "readwrite"
        );
        // Get the table
        const table = trans.objectStore(SceneManager.TABLENAME);
        // Write the data
        const putReq = table.put({ id: tilemapName, data: data });
        putReq.onsuccess = () => {};
    }

    /**
     * Load the tilemap
     * @param tilemapName the name of the tilemap
     * @returns the tileset data
     */
    static loadTilemap(tilemapName: string): IDBRequest {
        const trans = DatabaseManager.indexedDB.transaction(
            SceneManager.TABLENAME,
            "readonly"
        );
        const store = trans.objectStore(SceneManager.TABLENAME);
        return store.get(tilemapName);
    }

    static enableStoreLocally(): IDBFactory {
        return window.indexedDB;
    }
}
