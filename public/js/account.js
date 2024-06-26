// avatar image uploader

const fileUpload = document.querySelector('.file-upload');

const uploadButton = document.querySelector('.upload-button');

const readURL = input => {
	if (input.files && input.files[0]) {
		let reader = new FileReader();

		reader.onload = function (e) {
			document.querySelector('.profile-pic').setAttribute('src', e.target.result);
		};

		reader.readAsDataURL(input.files[0]);
	}
};

fileUpload.addEventListener('change', function () {
	readURL(this);
});

uploadButton.addEventListener('click', () => {
	fileUpload.click();
});

const gravatarOption = document.getElementById('gravatarOption');
const googleOption = document.getElementById('googleOption');
const uploadOption = document.getElementById('uploadOption');
const editAccountForm = document.getElementById('editAccountForm');
const avatarUploader = document.querySelector('.file-upload');

gravatarOption.addEventListener('change', e => {
	if (e.target.checked) {
		avatarUploader.type = 'text';
		editAccountForm.removeAttribute('enctype');
	}
});
if (googleOption) {
	googleOption.addEventListener('change', e => {
		if (e.target.checked) {
			avatarUploader.type = 'text';
			editAccountForm.removeAttribute('enctype');
		}
	});
}

uploadOption.addEventListener('change', e => {
	if (e.target.checked) {
		avatarUploader.type = 'file';
		editAccountForm.setAttribute('enctype', 'multipart/form-data');
	}
});

if (!uploadOption.checked) avatarUploader.type = 'text';
if (gravatarOption.checked) avatarUploader.type = 'text';
if (googleOption.checked) avatarUploader.type = 'text';
if (uploadOption.checked) avatarUploader.type = 'file';
