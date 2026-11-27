// TinyMCE
const initTinyMCE = (id) => {
  if(typeof tinymce === "undefined") return;
  tinymce.init({
    selector: id || '[textarea-mce]',
    plugins: 'charmap code codesample emoticons image link lists media',
    toolbar: `undo redo | styles | bold italic | alignleft aligncenter alignright alignjustify | bullist numlist outdent indent | link image | print preview media fullscreen | forecolor backcolor emoticons | charmap code codesample emoticons | help`,
    images_upload_url: `/${pathAdmin}/upload/image`
  });
}

initTinyMCE();
// End TinyMCE
const getEditorContent = (id) => typeof tinymce !== "undefined" && tinymce.get(id) ? tinymce.get(id).getContent() : (document.getElementById(id)?.value || "");
