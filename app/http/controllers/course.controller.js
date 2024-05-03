const Controller = require('app/http/controllers/controller');
const Course = require('../../models/course.model');
class CourseController extends Controller {
	//
	getCoursesPage(req, res, next) {
		try {
			res.render('pages/courses/index.ejs');
		} catch (error) {
			next(error);
		}
	}
	//
	async getSingleCoursePage(req, res, next) {
		try {
			const { courseSlug } = req.params;
			const course = await Course.findOne({ slug: courseSlug }, { images: 0, slug: 0, updatedAt: 0, __v: 0 })
				.populate([{ path: 'episodes' }, { path: 'user' }])
				.exec();
			const title = course.title;
			const canUse = await this.canUserUse(req, course);
			res.render('pages/courses/single', { title, course, canUse });
		} catch (error) {
			next(error);
		}
	}
	async canUserUse(req, course) {
		let canUse = false;
		if (req.isAuthenticated()) {
			let isVip = req.user.isVip();
			switch (course.type) {
				case 'paid':
					canUse = isVip ? true : await req.user.checkIfLearning(course);
					break;
				case 'vip':
					canUse = true;
					break;
				default:
					canUse = true;
					break;
			}
		}
		return canUse;
	}
}

module.exports = new CourseController();
