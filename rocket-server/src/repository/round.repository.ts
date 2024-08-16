import Round from 'src/model/round.model';

export default class RoundRepository {
  private mRounds: Round[] = [];

  async save(round: Round) {
    this.mRounds.push(round);
  }

  async list(): Promise<Round[]> {
    return [...this.mRounds];
  }
}
