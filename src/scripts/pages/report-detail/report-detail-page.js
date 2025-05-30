import {
  generateCommentsListEmptyTemplate,
  generateCommentsListErrorTemplate,
  generateLoaderAbsoluteTemplate,
  generateRemoveReportButtonTemplate,
  generateReportCommentItemTemplate,
  generateReportDetailErrorTemplate,
  generateReportDetailTemplate,
  generateSaveReportButtonTemplate,
} from '../../templates';
import { createCarousel } from '../../utils';
import ReportDetailPresenter from './report-detail-presenter';
import { parseActivePathname } from '../../routes/url-parser';
import Map from '../../utils/map';
import * as RuangKisahAPI from '../../data/api';

export default class ReportDetailPage {
  #state = {
    presenter: null,
    form: null,
    map: null,
    config: {
      mapZoom: 15,
      defaultMessage: 'Beri tanggapan terkait laporan.'
    }
  };

  constructor() {
    this.#initializeComponents();
  }

  #initializeComponents() {
    this.#bindMethods();
  }

  #bindMethods() {
    // Bind all methods to maintain 'this' context
    this.render = this.render.bind(this);
    this.afterRender = this.afterRender.bind(this);
    this.populateReportDetailAndInitialMap = this.populateReportDetailAndInitialMap.bind(this);
    this.initialMap = this.initialMap.bind(this);
  }

  async render() {
    return `
      <section>
        <div class="report-detail__container">
          <div id="report-detail" class="report-detail"></div>
          <div id="report-detail-loading-container"></div>
        </div>
      </section>
      
      ${this.#renderCommentSection()}
    `;
  }

  #renderCommentSection() {
    return `
      <section class="container">
        <hr>
        <div class="report-detail__comments__container">
          ${this.#renderCommentForm()}
          <hr>
          ${this.#renderCommentsList()}
        </div>
      </section>
    `;
  }

  #renderCommentForm() {
    return `
      <div class="report-detail__comments-form__container">
        <h2 class="report-detail__comments-form__title">Beri Tanggapan</h2>
        <form id="comments-list-form" class="report-detail__comments-form__form">
          <textarea 
            name="body" 
            placeholder="${this.#state.config.defaultMessage}"
          ></textarea>
          <div id="submit-button-container">
            <button class="btn" type="submit">Tanggapi</button>
          </div>
        </form>
      </div>
    `;
  }

  #renderCommentsList() {
    return `
      <div class="report-detail__comments-list__container">
        <div id="report-detail-comments-list"></div>
        <div id="comments-list-loading-container"></div>
      </div>
    `;
  }

  async afterRender() {
    this.#initializePresenter();
    this.#setupForm();
    await this.#loadInitialData();
  }

  #initializePresenter() {
    this.#state.presenter = new ReportDetailPresenter(parseActivePathname().id, {
      view: this,
      apiModel: RuangKisahAPI,
    });
  }

  #setupForm() {
    this.#state.form = document.getElementById('comments-list-form');
    this.#state.form.addEventListener('submit', this.#handleFormSubmit.bind(this));
  }

  async #handleFormSubmit(event) {
    event.preventDefault();
    const formData = {
      body: this.#state.form.elements.namedItem('body').value,
    };
    await this.#state.presenter.postNewComment(formData);
  }

  async #loadInitialData() {
    await Promise.all([
      this.#state.presenter.showReportDetail(),
      this.#state.presenter.getCommentsList()
    ]);
  }

  async populateReportDetailAndInitialMap(message, report) {
    document.getElementById('report-detail').innerHTML = generateReportDetailTemplate({
      title: report.title,
      description: report.description,
      damageLevel: report.damageLevel,
      evidenceImages: report.evidenceImages,
      location: report.location,
      latitudeLocation: report.location.latitude,
      longitudeLocation: report.location.longitude,
      reporterName: report.reporter.name,
      createdAt: report.createdAt,
    });

    // Carousel images
    createCarousel(document.getElementById('images'));

    // Map
    await this.#state.presenter.showReportDetailMap();
  if (this.#state.map) {
    const reportCoordinate = [report.location.latitude, report.location.longitude];
    const markerOptions = { alt: report.title };
    const popupOptions = { content: report.title };
    this.#state.map.changeCamera(reportCoordinate);
    this.#state.map.addMarker(reportCoordinate, markerOptions, popupOptions);
  }
    // Actions buttons
    this.#state.presenter.showSaveButton();
    this.addNotifyMeEventListener();
  }

  populateReportDetailError(message) {
    document.getElementById('report-detail').innerHTML = generateReportDetailErrorTemplate(message);
  }

  populateReportDetailComments(message, comments) {
    if (comments.length <= 0) {
      this.populateCommentsListEmpty();
      return;
    }

    const html = comments.reduce(
      (accumulator, comment) =>
        accumulator.concat(
          generateReportCommentItemTemplate({
            photoUrlCommenter: comment.commenter.photoUrl,
            nameCommenter: comment.commenter.name,
            body: comment.body,
          }),
        ),
      '',
    );

    document.getElementById('report-detail-comments-list').innerHTML = `
      <div class="report-detail__comments-list">${html}</div>
    `;
  }

  populateCommentsListEmpty() {
    document.getElementById('report-detail-comments-list').innerHTML =
      generateCommentsListEmptyTemplate();
  }

  populateCommentsListError(message) {
    document.getElementById('report-detail-comments-list').innerHTML =
      generateCommentsListErrorTemplate(message);
  }

  async initialMap() {
    // TODO: map initialization
    this.#state.map = await Map.build('#map', {
      zoom: 15,
    });
  }

  postNewCommentSuccessfully(message) {
    console.log(message);

    this.#state.presenter.getCommentsList();
    this.clearForm();
  }

  postNewCommentFailed(message) {
    alert(message);
  }

  clearForm() {
    this.#state.form.reset();
  }

  renderSaveButton() {
    document.getElementById('save-actions-container').innerHTML =
      generateSaveReportButtonTemplate();

    
  }

  renderRemoveButton() {
    document.getElementById('save-actions-container').innerHTML =
      generateRemoveReportButtonTemplate();

    
  }

  addNotifyMeEventListener() {
    document.getElementById('report-detail-notify-me').addEventListener('click', () => {
      alert('Fitur notifikasi laporan akan segera hadir!');
    });
  }

  showReportDetailLoading() {
    document.getElementById('report-detail-loading-container').innerHTML =
      generateLoaderAbsoluteTemplate();
  }

  hideReportDetailLoading() {
    document.getElementById('report-detail-loading-container').innerHTML = '';
  }

  showMapLoading() {
    document.getElementById('map-loading-container').innerHTML = generateLoaderAbsoluteTemplate();
  }

  hideMapLoading() {
    document.getElementById('map-loading-container').innerHTML = '';
  }

  showCommentsLoading() {
    document.getElementById('comments-list-loading-container').innerHTML =
      generateLoaderAbsoluteTemplate();
  }

  hideCommentsLoading() {
    document.getElementById('comments-list-loading-container').innerHTML = '';
  }

  showSubmitLoadingButton() {
    document.getElementById('submit-button-container').innerHTML = `
      <button class="btn" type="submit" disabled>
        <i class="fas fa-spinner loader-button"></i> Tanggapi
      </button>
    `;
  }

  hideSubmitLoadingButton() {
    document.getElementById('submit-button-container').innerHTML = `
      <button class="btn" type="submit">Tanggapi</button>
    `;
  }
}

const presenter = new HomePresenter({
  view: homePage,
  model: StoryAPI
});

await presenter.initialGalleryAndMap();
