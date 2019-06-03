import { File } from './file';

export class FileManager {
  private files;
  constructor() {
    this.files = {};
  }

  public new(name, code = '') {
    this.files[name] = new File(name, code);
    return this.files[name];
  }

  public save(file) {
    this.files[file.name] = file;
  }

  public load(name) {
    const file = this.files[name];
    if (file) {
      return file;
    } else {
      this.new(name);
      return this.files[name];
    }
  }

  public list() {
    return this.files;
  }
}
