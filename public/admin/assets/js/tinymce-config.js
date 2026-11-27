// TinyMCE
const initTinyMCE = (id) => {
  if(typeof tinymce === "undefined") {
    return;
  }
  tinymce.init({
    selector: id || '[textarea-mce]',
    height: 300,
    menubar: false,
    statusbar: true,
    plugins: 'charmap code codesample image link lists media',
    toolbar: "undo redo | blocks | bold italic | alignleft aligncenter alignright | bullist numlist | link image | code",
    images_upload_url: `/${pathAdmin}/upload/image`
  });
}

initTinyMCE();
// End TinyMCE
const getEditorContent = (id) => typeof tinymce !== "undefined" && tinymce.get(id) ? tinymce.get(id)
  .getContent() : (document.getElementById(id)
    ?.value || "");
