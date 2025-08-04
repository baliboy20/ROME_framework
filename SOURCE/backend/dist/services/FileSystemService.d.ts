export interface SavedFile {
    filename: string;
    filepath: string;
    size: number;
    savedAt: Date;
    url: string;
    title: string;
}
export interface FileSystemOptions {
    baseDirectory?: string;
    organizationStrategy?: 'flat' | 'by-domain' | 'by-date' | 'by-email';
    filenameFormat?: 'title' | 'url-slug' | 'timestamp-title';
    maxFilenameLength?: number;
}
export declare class FileSystemService {
    private options;
    private readonly defaultOptions;
    constructor(options?: FileSystemOptions);
    initialize(): Promise<void>;
    saveMarkdownFile(content: string, metadata: {
        url: string;
        title: string;
        domain: string;
        emailId?: string;
        date?: Date;
    }): Promise<SavedFile>;
    saveMultipleFiles(files: Array<{
        content: string;
        metadata: {
            url: string;
            title: string;
            domain: string;
            emailId?: string;
            date?: Date;
        };
    }>): Promise<SavedFile[]>;
    private getTargetDirectory;
    private generateFilename;
    private ensureDirectory;
    private fileExists;
    listSavedFiles(directory?: string): Promise<SavedFile[]>;
    private walkDirectory;
    deleteFile(filepath: string): Promise<boolean>;
    getFileContent(filepath: string): Promise<string | null>;
}
export declare const fileSystemService: FileSystemService;
//# sourceMappingURL=FileSystemService.d.ts.map