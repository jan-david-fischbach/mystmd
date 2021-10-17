import { JsonObject } from '@curvenote/blocks';
import { AnyAction } from '@reduxjs/toolkit';
import { Session } from './session';
import { RootState } from './store';

export class BaseTransfer<ID, DTO extends { id: ID }> {
  kind = '';

  session: Session;

  id: ID;

  $data?: DTO;

  $fromDTO: (id: ID, json: JsonObject) => DTO = () => {
    throw new Error('Must be set in base class');
  };

  $createUrl: () => string = () => {
    throw new Error('Must be set in base class');
  };

  $selector?: (state: RootState, id: ID) => DTO;

  $recieve?: (dto: DTO) => AnyAction;

  constructor(session: Session, id: ID) {
    this.id = id;
    this.session = session;
  }

  get data(): DTO {
    if (this.$data) return this.$data;
    throw new Error(`${this.kind}: Must call "get" first`);
  }

  set data(data: DTO) {
    this.id = data.id;
    this.$data = this.$fromDTO(data.id, data);
    if (this.$recieve) this.session.$store.dispatch(this.$recieve(data));
  }

  async get() {
    const url = this.$createUrl();
    const fromSession = this.$selector?.(this.session.$store.getState(), this.id);
    if (fromSession) {
      this.session.log.debug(`Loading ${this.kind} from cache: "${url}"`);
      this.data = fromSession;
      return this;
    }
    this.session.log.debug(`Fetching ${this.kind}: "${url}"`);
    const { status, json } = await this.session.get(url);
    if (status !== 200)
      throw new Error(`${this.kind}: Not found (${url}) or you do not have access.`);
    this.data = json;
    return this;
  }
}