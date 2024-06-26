const httpErrors = require('http-errors');

const Controller = require('app/http/controllers/controller');
const Episode = require('../../../models/episode.model');
const Course = require('../../../models/course.model');
const { sprintf } = require('sprintf-js');
class EpisodeController extends Controller {
	constructor() {
		super();
	}
	//
	async create(req, res, next) {
		try {
			await Episode.create({ ...req.body });
			await this.updateCourseTime(req.body.course);
			return this.flashAndRedirect(req, res, 'success', `جلسه ${req.body.title} با موفقیت اضافه شد`, '/admin/episodes');
		} catch (error) {
			next({ status: 500, message: `something went wrong !`, stack: error.stack });
		}
	}
	//
	async edit(req, res, next) {
		try {
			// check if the episode exists
			const foundedEpisode = await Episode.findById(req.body.episodeId);
			if (!foundedEpisode)
				return this.flashAndRedirect(
					req,
					res,
					'error',
					'شناسه جلسه نامعتبر است',
					`/admin/videos/${req.body.episodeId}/edit`
				);
			// check if the related course exists
			const foundedCourse = await Course.findById(req.body.course);
			if (!foundedCourse)
				return this.flashAndRedirect(
					req,
					res,
					'error',
					'شناسه دوره نامعتبر است',
					`/admin/videos/${req.body.episodeId}/edit`
				);
			const updatedEpisode = await Episode.updateOne(
				{ _id: req.body.episodeId },
				{
					$set: {
						...req.body,
					},
				}
			);
			if (!updatedEpisode) {
				return this.flashAndRedirect(
					req,
					res,
					'error',
					`عملیات به روز رسانی جلسه ${req.body.title} ناموفق بود. دوباره تلاش کنید`,
					`/admin/episodes/${req.body.episodeId}/edit`
				);
			}
			await this.updateCourseTime(foundedCourse._id);
			return this.flashAndRedirect(
				req,
				res,
				'success',
				`جلسه ${req.body.title} با موفقیت به روز رسانی شد`,
				'/admin/episodes'
			);
		} catch (error) {
			next(error);
		}
	}
	//
	async delete(req, res, next) {
		try {
			const { episode } = req.body;
			const { id } = req.params;
			const foundedEpisode = await Episode.findOneAndDelete({
				$and: [{ title: episode }, { _id: id }],
			});
			if (!foundedEpisode) {
				req.flash('error', `عملیات حذف دوره موفقیت آمیز نبود . لطفا مجدد تلاش کنید.`);
				return res.redirect(`/admin/courses/${req.body.courseId}/delete`);
			} else {
				await this.updateCourseTime(foundedEpisode.course);
				req.flash('success', 'دوره با موفقیت حذف شد');
			}
			return res.redirect(`/admin/episodes`);
		} catch (error) {
			next(error);
		}
	}
	//
	async getIndexPage(req, res, next) {
		try {
			let page = req.query.page ?? 1;
			const title = 'پنل مدیریت | ویدیو ها';
			const episodes = await Episode.paginate(
				{},
				{ limit: 4, page, sort: { createdAt: 'desc' }, lean: true, populate: [{ path: 'course', select: 'title' }] }
			);
			if (isNaN(page)) {
				req.flash('شماره صفحه نامعتبر است');
				return res.redirect('/admin/episodes/');
			}
			return res.render('admin/episode/index', { title, episodes });
		} catch (error) {
			next(new httpErrors.InternalServerError('بارگذاری صفحه ویدیو ها با مشکل مواجه شد'));
		}
	}
	//
	async getCreateEpisodePage(req, res, next) {
		try {
			const title = 'پنل مدیریت | جلسه جدید';
			const courses = await Course.find({}, { title: 1, slug: 1 }).lean();
			return res.render('admin/episode/create', { title, courses });
		} catch (error) {
			next(new httpErrors.InternalServerError('بارگذاری صفحه ایجاد ویدیو ها با مشکل مواجه شد'));
		}
	}
	//
	async getEditCoursePage(req, res, next) {
		try {
			const title = 'پنل مدیریت | ویرایش جلسه';
			const episode = await Episode.findById(req.params.id).lean();
			if (!episode) {
				return this.flashAndRedirect(req, res, 'error', 'آیدی جلسه نامعتبر است', '/admin/episodes');
			}
			res.render('admin/episode/edit', { title, episode });
		} catch (error) {
			next(error);
		}
	}
	//
	async getDeleteEpisodePage(req, res, next) {
		try {
			const title = 'پنل مدیریت | حذف جلسه';
			const episode = await Episode.findById(req.params.id).lean();
			if (!episode) {
				req.flash('error', 'آیدی جلسه نامعتبر است');
				res.redirect('/admin/episodes');
			}
			res.render('admin/episode/delete', { title, episode });
		} catch (error) {
			next(error);
		}
	}
	//
	async updateCourseTime(courseId) {
		let course = await Course.findById(courseId).populate('episodes').exec();
		course.set({ time: this.getTime(course.episodes) });
		await course.save();
	}
	getTime(episodes) {
		let second = 0;
		episodes.forEach(episode => {
			let time = episode.time.split(':');
			if (time.length == 2) {
				second += parseInt(time[0]) * 60;
				second += parseInt(time[1]);
			} else if (time.length == 3) {
				second += parseInt(time[0]) * 60 * 60;
				second += parseInt(time[1]) * 60;
				second += parseInt(time[0]);
			}
		});
		let minutes = Math.floor(second / 60);
		let hours = Math.floor(minutes / 60);
		minutes -= hours * 60;
		second = Math.floor(((second / 60) % 1) * 60);
		return sprintf('%02d:%02d:%02d', hours, minutes, second);
	}
}

module.exports = new EpisodeController();
