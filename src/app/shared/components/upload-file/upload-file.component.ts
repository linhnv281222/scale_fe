import { HttpClient, HttpHeaders } from '@angular/common/http';
import {
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
  SimpleChanges,
} from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { saveAs } from 'file-saver';
import { NzResizeEvent } from 'ng-zorro-antd/resizable';
import { ToastrService } from 'ngx-toastr';
import { firstValueFrom } from 'rxjs';
import { environment } from 'src/environment/environment';

@Component({
  selector: 'app-upload-file',
  templateUrl: './upload-file.component.html',
  styleUrls: ['./upload-file.component.css'],
})
export class UploadFileComponent implements OnInit {
  @Output() outputListFile: EventEmitter<any> = new EventEmitter<any>();
  @Output() outputListFileFromBE: EventEmitter<any> = new EventEmitter<any>();
  @Input() files: any[] = [];
  @Input() filesFromBE: any[] = [];
  @Input() type: string = 'file';
  @Input() maxFiles = 999;
  @Input() maxFileSizeMB = 100;
  @Input() allowUpload: boolean = true;
  @Input() isUpdate: boolean = false;
  @Input() showTime: boolean = true;
  @Input() allowedFileTypes: string[] = []; // Ví dụ: ['pdf', 'docx', 'doc']
  @Input() required: boolean = false; // Bắt buộc phải upload file
  @Input() downloadUrl?: string; // URL để download file
  @Input() previewUrl?: string; // URL để preview file
  allowedFileTypesText: string = ''; // Text hiển thị loại file được phép

  constructor(
    private toastr: ToastrService,
    public sanitizer: DomSanitizer,
    private http: HttpClient
  ) {}
  // Preview file
  @Input() width = 1000;
  currentFilePath: any = '';
  currentFileName: string = '';
  fileType: string = '';
  iframeContentImage: any = '';
  isDragOver = false;
  id = -1;

  sanitizeResourceUrl(url: string): SafeResourceUrl {
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }

  ngOnInit() {
    if (this.files == undefined) {
      this.files = [];
    }
    this.updateAllowedFileTypesText();
  }
  ngOnChanges(changes: SimpleChanges): void {
    if ('isUpdate' in changes) {
      this.files = [];
    }
    if ('allowedFileTypes' in changes) {
      this.updateAllowedFileTypesText();
    }
  }

  // Open drawer
  visible = false;
  openDrawer() {
    this.visible = true;
  }
  close(): void {
    this.visible = false;
  }

  async downloadFile(file: any) {
    if (!file.path) {
      this.toastr.error('Không tìm thấy đường dẫn file', 'Lỗi');
      return;
    }

    try {
      const url = this.downloadUrl
        ? `${this.downloadUrl}/${file.path}`
        : `${environment.api_end_point}/api/v1/files/${file.path}`;

      const token = localStorage.getItem('token');
      const language = localStorage.getItem('language') || 'vi_VN';

      const headers = new HttpHeaders({
        'Accept-Language': language,
        ...(token && { Authorization: `Bearer ${token}` }),
      });

      const blob = await firstValueFrom(
        this.http.get(url, {
          headers,
          responseType: 'blob',
        })
      );

      saveAs(blob, file.fileName || file.name || 'download');
    } catch (error) {
      this.toastr.error('Không thể tải file', 'Lỗi');
    }
  }

  onFileChange(event: any) {
    event.preventDefault();
    const selectedFiles: File[] = Array.from(event.target.files);
    this.handleFileSelection(selectedFiles);
  }

  previewFile(file: any) {
    if (file.id) {
      const fileExtension = this.getFileExtension(file.fileName);
      this.fileType = fileExtension;
      switch (fileExtension) {
        case 'pdf':
          this.currentFileName = file.fileName;
          const pdfUrl = this.previewUrl
            ? `${this.previewUrl}/${file.path}`
            : `${environment.api_end_point}/api/v1/files/preview/${file.path}`;
          this.currentFilePath =
            this.sanitizer.bypassSecurityTrustResourceUrl(pdfUrl);
          this.visible = true;
          break;
        case 'jpg':
        case 'jpeg':
        case 'png':
          const imageUrl = this.previewUrl
            ? `${this.previewUrl}/${file.path}`
            : `${environment.api_end_point}/api/v1/files/preview/${file.path}`;
          this.iframeContentImage = this.sanitizer.bypassSecurityTrustHtml(
            `<html><body style="margin: 0;"><img src="${imageUrl}" style="width: 100%;"></body></html>`
          );
          this.currentFileName = file.fileName;
          this.visible = true;
          break;
        default:
          this.downloadFile(file);
          // this.notificationMessage.notificationError(
          //   `Chức năng này chỉ hỗ trợ các file có định dạng .jpg, .jpeng, .png, .heic, .pdf, .txt,`
          // );
          break;
      }
    } else {
      const fileExtension = this.getFileExtension(file.name);
      this.fileType = fileExtension;
      switch (fileExtension) {
        case 'pdf':
          this.currentFilePath = this.sanitizer.bypassSecurityTrustResourceUrl(
            URL.createObjectURL(file)
          );
          this.currentFileName = file.name;
          this.visible = true;
          break;
        case 'jpg':
        case 'jpeg':
        case 'png':
          // case 'heic':
          this.iframeContentImage = this.sanitizer.bypassSecurityTrustHtml(
            `<html><body style="margin: 0;"><img src="${URL.createObjectURL(
              file
            )}" style="width: 100%;"></body></html>`
          );
          this.currentFileName = file.name;
          this.visible = true;
          break;
        default:
          // Tạo một URL cho file đã chọn
          var url = URL.createObjectURL(file);

          // Tạo một anchor element để tải file
          var a = document.createElement('a');
          a.href = url;
          a.download = file.name;

          // Mô phỏng sự kiện nhấn nút tải file
          var event = new MouseEvent('click');
          a.dispatchEvent(event);

          // Giải phóng bộ nhớ đã dùng để tạo URL
          URL.revokeObjectURL(url);
          // this.notificationMessage.notificationError(
          //   `Chức năng này chỉ hỗ trợ các file có định dạng .jpg, .jpeng, .png, .heic, .pdf`
          // );
          break;
      }
    }
  }

  onResize({ width }: NzResizeEvent): void {
    cancelAnimationFrame(this.id);
    this.id = requestAnimationFrame(() => {
      this.width = width!;
    });
  }

  isShowDeleteWarning: boolean = false;
  titleDeleteWarning: string = '';
  contentDeleteWarning: string = '';
  fileDelete: any = {};
  onHandleCancelDelete($event: any) {
    this.isShowDeleteWarning = $event;
  }

  async onHandleConfirmDelete($event: any) {
    if ($event == true) {
      const index = this.filesFromBE.findIndex(
        (file) => file.fileName === this.fileDelete.fileName
      );

      if (index !== -1) {
        // For now, just remove from local array
        // If you need to call API to delete, add @Input() deleteFileService
        this.filesFromBE.splice(index, 1);
        this.toastr.success(
          `Đã xóa ${this.fileDelete.fileName} khỏi danh sách`,
          'Thành công'
        );
      }
    }
    this.outputListFileFromBE.emit(this.filesFromBE);
    this.validateRequired();
  }

  async deleteFile(file: any) {
    if (file.id) {
      this.isShowDeleteWarning = true;
      this.titleDeleteWarning = `File`;
      this.contentDeleteWarning = `${file.fileName}`;
      this.fileDelete = file;
    } else {
      const index = this.files.findIndex(
        (fileIndex) => fileIndex.name === file.name
      );
      if (index !== -1) {
        this.files.splice(index, 1);
        this.toastr.success('Đã xóa thành công', 'Thành công');
      }
      this.outputListFile.emit(this.files);
      this.validateRequired();
    }
  }

  handleFileSelection(selectedFiles: File[]) {
    // Kiểm tra kích thước và số lượng file
    for (const file of selectedFiles) {
      if (file.size > this.maxFileSizeMB * 1024 * 1024) {
        this.toastr.warning(
          `File ${file.name} vượt quá kích thước tối đa (${this.maxFileSizeMB} MB).`,
          'Cảnh báo'
        );
        return;
      }
    }
    if (this.files.length + selectedFiles.length > this.maxFiles) {
      this.toastr.warning(
        `Số lượng file đã chọn vượt quá giới hạn (${this.maxFiles}).`,
        'Cảnh báo'
      );
      return;
    }

    // Kiểm tra loại file được phép
    if (this.allowedFileTypes && this.allowedFileTypes.length > 0) {
      for (const file of selectedFiles) {
        const fileExtension = this.getFileExtension(file.name).toLowerCase();
        if (!this.allowedFileTypes.includes(fileExtension)) {
          const allowedTypesStr = this.allowedFileTypes
            .join(', ')
            .toUpperCase();
          this.toastr.error(
            `File ${file.name} không đúng định dạng. Chỉ chấp nhận các file: ${allowedTypesStr}`,
            'Lỗi'
          );
          return;
        }
      }
    }

    for (const file of selectedFiles) {
      const fileExtension = this.getFileExtension(file.name);
      this.fileType = fileExtension;
    }

    for (const file of selectedFiles) {
      if (this.isFileExist(file.name)) {
        this.toastr.warning(
          `File ${file.name} đã tồn tại trong danh sách`,
          'Cảnh báo'
        );
      } else if (this.isFileBEExist(file.name)) {
        this.toastr.warning(
          `File ${file.name} đã tồn tại trong danh sách`,
          'Cảnh báo'
        );
      } else {
        this.files.push(file);
      }
    }
    this.outputListFile.emit(this.files);
    this.validateRequired();
  }

  isFileExist(fileName: string): boolean {
    return this.files.some((file) => file.name === fileName);
  }

  isFileBEExist(fileName: string): boolean {
    return this.filesFromBE.some((file) => file.fileName === fileName);
  }

  onFileDrop(event: any) {
    event.preventDefault();
    this.isDragOver = false;
    const droppedFiles: File[] = Array.from(event.dataTransfer.files);
    this.handleFileSelection(droppedFiles);
  }

  onDragEnter(event: any) {
    event.preventDefault();
    this.isDragOver = true;
  }

  onDragLeave(event: any) {
    event.preventDefault();
    this.isDragOver = false;
  }

  onDragOver(event: any) {
    this.isDragOver = true;
    event.preventDefault();
  }

  getFileExtension(fileName: string): string {
    const parts = fileName.split('.');
    return parts[parts.length - 1].toLowerCase();
  }

  getFileDisplayName(fileName: string, limit: number): string {
    if (fileName?.length <= limit) {
      return fileName;
    } else {
      return fileName?.substring(0, limit) + '...';
    }
  }

  validateRequired(): boolean {
    if (
      this.required &&
      this.files.length === 0 &&
      this.filesFromBE.length === 0
    ) {
      this.toastr.warning('Vui lòng upload file', 'Cảnh báo');
      return false;
    }
    return true;
  }

  updateAllowedFileTypesText(): void {
    if (this.allowedFileTypes && this.allowedFileTypes.length > 0) {
      this.allowedFileTypesText = this.allowedFileTypes
        .join(', ')
        .toUpperCase();
    } else {
      this.allowedFileTypesText = '';
    }
  }

  styleWithoutShowTime: any = {
    left: {
      padding: '4px 16px',
      background: '#eff1f4',
      'margin-bottom': '6px',
      'border-radius': '4px',
      'align-items': 'center',
      display: 'flex',
      'justify-content': 'space-between',
    },
    content: {
      display: 'flex',
      'align-items': 'center',
      'justify-content': 'right',
    },
    time: {
      color: '#bdbdbd',
      'white-space': 'nowrap',
      overflow: 'hidden',
      'text-overflow': 'ellipsis',
      'flex-grow': '1',
      'line-height': 'normal',
    },
  };
  styleWithShowTime: any = {
    left: {
      padding: '4px 16px',
      background: '#eff1f4',
      'margin-bottom': '6px',
      'border-radius': '4px',
      'align-items': 'center',
    },
    content: {
      display: 'flex',
      'align-items': 'center',
    },
    time: {
      color: '#bdbdbd',
      'white-space': 'nowrap',
      overflow: 'hidden',
      'text-overflow': 'ellipsis',
      'flex-grow': '1',
    },
  };
}
