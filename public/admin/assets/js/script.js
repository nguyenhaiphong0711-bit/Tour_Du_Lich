// Menu
const buttonMenuMobile = document.querySelector(".header .inner-button-menu");
if(buttonMenuMobile) {
  const sider = document.querySelector(".sider");
  const siderOverlay = document.querySelector(".sider-overlay");
  const mobileNav = window.matchMedia("(max-width: 991px)");
  const closeMenu = () => {
    sider.classList.remove("active");
    siderOverlay.classList.remove("active");
    document.body.classList.remove("sidebar-open");
    buttonMenuMobile.setAttribute("aria-expanded", String(!mobileNav.matches && !document.body.classList.contains("nav-collapsed")));
  };
  buttonMenuMobile.setAttribute("aria-expanded", String(!mobileNav.matches));
  buttonMenuMobile.addEventListener("click", () => {
    if(mobileNav.matches) {
      const open = !sider.classList.contains("active");
      sider.classList.toggle("active", open);
      siderOverlay.classList.toggle("active", open);
      document.body.classList.toggle("sidebar-open", open);
      buttonMenuMobile.setAttribute("aria-expanded", String(open));
    } else {
      document.body.classList.toggle("nav-collapsed");
      buttonMenuMobile.setAttribute("aria-expanded", String(!document.body.classList.contains("nav-collapsed")));
    }
  });
  siderOverlay.addEventListener("click", closeMenu);
  mobileNav.addEventListener("change", closeMenu);
  document.addEventListener("keydown", event => {
    if(event.key === "Escape" && sider.classList.contains("active")) {
      closeMenu();
      buttonMenuMobile.focus();
    }
  });
}
document.addEventListener("keydown", event => {
  const searchInput = document.querySelector("#global-search");
  if((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k" && searchInput?.offsetParent) {
    event.preventDefault();
    searchInput.focus();
  }
});
// End Menu

// Schedule Section 8
const scheduleSection8 = document.querySelector(".inner-schedule");
if(scheduleSection8) {
  const buttonCreate = scheduleSection8.querySelector(".inner-schedule-create");
  const listItem = scheduleSection8.querySelector(".inner-schedule-list");

  buttonCreate.addEventListener("click", () => {
    const firstItem = listItem.querySelector(".inner-schedule-item");
    const cloneItem = firstItem.cloneNode(true);
    cloneItem.querySelector(".inner-schedule-head input").value = "";
    cloneItem.classList.remove("hidden");
    cloneItem.querySelector(".inner-more").setAttribute("aria-expanded", "true");

    const innerBody = cloneItem.querySelector(".inner-schedule-body");
    const id = `mce_${Date.now()}`;
    innerBody.innerHTML = `<textarea id="${id}"></textarea>`;

    listItem.appendChild(cloneItem);

    initTinyMCE(`#${id}`);
  })

  listItem.addEventListener("click", (event) => {
    // Đóng/mở item
    if(event.target.closest(".inner-more")) {
      const parentItem = event.target.closest(".inner-schedule-item");
      if(parentItem) {
        parentItem.classList.toggle("hidden");
        parentItem.querySelector(".inner-more").setAttribute("aria-expanded", String(!parentItem.classList.contains("hidden")));
      }
    }

    // Xóa item
    if(event.target.closest(".inner-remove")) {
      const parentItem = event.target.closest(".inner-schedule-item");
      const totalItem = listItem.querySelectorAll(".inner-schedule-item").length;
      if(parentItem && totalItem > 1) {
        const id = parentItem.querySelector("textarea").id;
        if(typeof tinymce !== "undefined") tinymce.get(id)?.remove();
        parentItem.remove();
      }
    }
  })

  // Sắp xếp
  new Sortable(listItem, {
    handle: '.inner-move',
    animation: 150,
    onStart: (event) => {
      const textarea = event.item.querySelector(".inner-schedule-body textarea");
      const id = textarea.id;
      if(typeof tinymce !== "undefined") tinymce.get(id)?.remove();
    },
    onEnd: (event) => {
      const textarea = event.item.querySelector(".inner-schedule-body textarea");
      const id = textarea.id;
      initTinyMCE(`#${id}`);
    }
  })
}
// End Schedule Section 8

// Filepond Image
const listFilepondImage = document.querySelectorAll("[filepond-image]");
const filePond = {};
const originalImages = {};
if(listFilepondImage.length > 0) {
  FilePond.registerPlugin(FilePondPluginImagePreview);
  FilePond.registerPlugin(FilePondPluginFileValidateType);

  listFilepondImage.forEach((filepondImage) => {
    let files = null;
    const elementImageDefault = filepondImage.closest("[image-default]");
    if(elementImageDefault) {
      const imageDefault = elementImageDefault.getAttribute("image-default");
      originalImages[filepondImage.name] = imageDefault;
      if(imageDefault) {
        files = [
          {
            source: imageDefault, options: { metadata: { originalUrl: imageDefault } }
          }
        ]
      }
    }

    filePond[filepondImage.name] = FilePond.create(filepondImage, {
      labelIdle: 'Thả ảnh vào đây hoặc <span class="filepond--label-action">chọn ảnh</span>',
      labelFileLoading: "Đang tải ảnh", labelFileLoadError: "Không tải được ảnh", labelTapToRetry: "Nhấn để thử lại",
      labelFileTypeNotAllowed: "Vui lòng chọn tệp hình ảnh", imagePreviewHeight: 140,
      acceptedFileTypes: ['image/*'],
      files: files
    });
  })
}
// End Filepond Image

// Filepond Image Multi
const listFilepondImageMulti = document.querySelectorAll("[filepond-image-multi]");
const filePondMulti = {};
if(listFilepondImageMulti.length > 0) {
  FilePond.registerPlugin(FilePondPluginImagePreview);
  FilePond.registerPlugin(FilePondPluginFileValidateType);

  listFilepondImageMulti.forEach((filepondImage) => {
    let files = null;
    const elementListImageDefault = filepondImage.closest("[list-image-default]");
    if(elementListImageDefault) {
      let listImageDefault = elementListImageDefault.getAttribute("list-image-default");
      if(listImageDefault) {
        listImageDefault = JSON.parse(listImageDefault);
        files = [];
        listImageDefault.forEach(image => {
          files.push({
            source: image, options: { metadata: { originalUrl: image } }
          });
        })
      }
    }

    filePondMulti[filepondImage.name] = FilePond.create(filepondImage, {
      labelIdle: 'Thả ảnh vào đây hoặc <span class="filepond--label-action">chọn ảnh</span>',
      labelFileLoading: "Đang tải ảnh", labelFileLoadError: "Không tải được ảnh", labelTapToRetry: "Nhấn để thử lại",
      labelFileTypeNotAllowed: "Vui lòng chọn tệp hình ảnh", imagePreviewHeight: 140,
      acceptedFileTypes: ['image/*'],
      files: files
    });
  })
}
// End Filepond Image Multi

// FilePond giữ URL ảnh cũ trong metadata, chỉ gửi những tệp vừa thêm.
const appendImageRemoval = formData => {
  for(const [name, pond] of Object.entries(filePond)) {
    if(originalImages[name] && !pond.getFiles().length) formData.set(`clear${name.charAt(0).toUpperCase()}${name.slice(1)}`, "true");
  }
};
const getUploadFile = name => {
  const item = filePond[name]?.getFile();
  return item && !item.getMetadata("originalUrl") ? item.file : null;
};

// Revenue Chart
let revenueChartInstance;
let revenueRequest = 0;
const drawRevenueChart = async currentDate => {
  if(Number.isNaN(currentDate.getTime())) return;
  const requestId = ++revenueRequest;
  const currentMonth = currentDate.getMonth() + 1;
  const currentYear = currentDate.getFullYear();
  const prevDate = new Date(currentYear, currentMonth - 2, 1);
  const prevMonth = prevDate.getMonth() + 1;
  const prevYear = prevDate.getFullYear();
  const arrayDay = Array.from({ length: new Date(currentYear, currentMonth, 0).getDate() }, (_, i) => i + 1);
  const message = document.querySelector(".chart-message");
  try {
    const response = await fetch(`/${pathAdmin}/dashboard/revenue-chart`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentMonth, currentYear, prevMonth, prevYear, arrayDay })
    });
    const data = await response.json();
    if(requestId !== revenueRequest) return;
    if(!response.ok || data.code !== "success") throw new Error(data.message || "Chưa tải được doanh thu.");
    message.hidden = data.dataCurrentMonth.some(value => value > 0) || data.dataPrevMonth.some(value => value > 0);
    message.textContent = "Chưa có doanh thu trong khoảng thời gian này.";
    if(revenueChartInstance) revenueChartInstance.destroy();
    revenueChartInstance = new Chart(document.querySelector("#revenue-chart"), {
      type: "line",
      data: { labels: arrayDay, datasets: [
        { label: `Tháng ${currentMonth}/${currentYear}`, data: data.dataCurrentMonth, borderColor: "#6366f1", backgroundColor: "#6366f10d", fill: true, borderWidth: 2.5, tension: .35 },
        { label: `Tháng ${prevMonth}/${prevYear}`, data: data.dataPrevMonth, borderColor: "#c1c7d3", borderDash: [5, 5], borderWidth: 1.5, tension: .35 }
      ] },
      options: {
        maintainAspectRatio: false,
        elements: { point: { radius: 0, hoverRadius: 4, hitRadius: 10 } },
        interaction: { mode: "index", intersect: false },
        plugins: { legend: { display: false }, tooltip: { backgroundColor: "#182230", padding: 12, callbacks: { label: item => `${item.dataset.label}: ${Number(item.raw).toLocaleString("vi-VN")}₫` } } },
        scales: {
          x: { grid: { display: false }, border: { display: false }, ticks: { maxTicksLimit: 10, color: "#98a2b3", font: { size: 11 } } },
          y: { beginAtZero: true, border: { display: false }, grid: { color: "#f0f2f6" }, ticks: { maxTicksLimit: 5, color: "#98a2b3", font: { size: 11 }, callback: value => value >= 1000000 ? (value / 1000000).toLocaleString("vi-VN") + " tr" : Number(value).toLocaleString("vi-VN") } }
        }
      }
    });
  } catch(error) {
    if(requestId !== revenueRequest) return;
    message.hidden = false;
    message.textContent = error.message;
  }
};
if(document.querySelector("#revenue-chart")) {
  const inputChangeMonth = document.querySelector("[input-change-month]");
  const today = new Date();
  inputChangeMonth.value = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;
  drawRevenueChart(today);
  inputChangeMonth.addEventListener("change", () => {
    const [year, month] = inputChangeMonth.value.split("-").map(Number);
    if(year >= 2000 && year <= 2100 && month >= 1 && month <= 12) drawRevenueChart(new Date(year, month - 1, 1));
  });
}
// End Revenue Chart

// Category Create Form
const categoryCreateForm = document.querySelector("#category-create-form");
if(categoryCreateForm) {
  const validator = new JustValidate('#category-create-form');

  validator
    .addField('#name', [
      {
        rule: 'required',
        errorMessage: "Vui lòng nhập tên danh mục!"
      },
    ])
    .onSuccess((event) => {
      const name = event.target.elements.namedItem("name").value;
      const parent = event.target.elements.namedItem("parent").value;
      const position = event.target.elements.namedItem("position").value;
      const status = event.target.elements.namedItem("status").value;
      const avatar = getUploadFile("avatar");
      const description = getEditorContent("description");

      // Tạo FormData
      const formData = new FormData();
      appendImageRemoval(formData);
      formData.append("name", name);
      formData.append("parent", parent);
      formData.append("position", position);
      formData.append("status", status);
      if(avatar) formData.append("avatar", avatar);
      formData.append("description", description);

      fetch(`/${pathAdmin}/category/create`, {
        method: "POST",
        body: formData
      })
        .then(res => res.json())
        .then(data => {
          if(data.code == "error") {
            notify.error(data.message);
          }

          if(data.code == "success") {
            if(data.code !== "success") return notify.error(data.message);
            drawNotify(data.code, data.message);
            window.location.reload();
          }
        })
    })
}
// End Category Create Form

// Category Edit Form
const categoryEditForm = document.querySelector("#category-edit-form");
if(categoryEditForm) {
  const validator = new JustValidate('#category-edit-form');

  validator
    .addField('#name', [
      {
        rule: 'required',
        errorMessage: "Vui lòng nhập tên danh mục!"
      },
    ])
    .onSuccess((event) => {
      const id = event.target.elements.namedItem("id").value;
      const name = event.target.elements.namedItem("name").value;
      const parent = event.target.elements.namedItem("parent").value;
      const position = event.target.elements.namedItem("position").value;
      const status = event.target.elements.namedItem("status").value;
      let avatar = getUploadFile("avatar");
      const description = getEditorContent("description");

      // Tạo FormData
      const formData = new FormData();
      appendImageRemoval(formData);
      formData.append("name", name);
      formData.append("parent", parent);
      formData.append("position", position);
      formData.append("status", status);
      if(avatar) formData.append("avatar", avatar);
      formData.append("description", description);

      fetch(`/${pathAdmin}/category/edit/${id}`, {
        method: "PATCH",
        body: formData
      })
        .then(res => res.json())
        .then(data => {
          if(data.code == "error") {
            notify.error(data.message);
          }

          if(data.code == "success") {
            notify.success(data.message);
          }
        })
    })
}
// End Category Edit Form

// Tour Create Form
const tourCreateForm = document.querySelector("#tour-create-form");
if(tourCreateForm) {
  const validator = new JustValidate('#tour-create-form');

  validator
    .addField('#name', [
      {
        rule: 'required',
        errorMessage: "Vui lòng nhập tên tour!"
      },
    ])
    .onSuccess((event) => {
      const name = event.target.elements.namedItem("name").value;
      const category = event.target.elements.namedItem("category").value;
      const position = event.target.elements.namedItem("position").value;
      const status = event.target.elements.namedItem("status").value;
      const avatar = getUploadFile("avatar");
      const priceAdult = event.target.elements.namedItem("priceAdult").value;
      const priceChildren = event.target.elements.namedItem("priceChildren").value;
      const priceBaby = event.target.elements.namedItem("priceBaby").value;
      const priceNewAdult = event.target.elements.namedItem("priceNewAdult").value;
      const priceNewChildren = event.target.elements.namedItem("priceNewChildren").value;
      const priceNewBaby = event.target.elements.namedItem("priceNewBaby").value;
      const stockAdult = event.target.elements.namedItem("stockAdult").value;
      const stockChildren = event.target.elements.namedItem("stockChildren").value;
      const stockBaby = event.target.elements.namedItem("stockBaby").value;
      const locations = [];
      const time = event.target.elements.namedItem("time").value;
      const vehicle = event.target.elements.namedItem("vehicle").value;
      const departureDate = event.target.elements.namedItem("departureDate").value;
      const information = getEditorContent("information");
      const schedules = [];

      // locations
      const listInputLocation = tourCreateForm.querySelectorAll(`input[name="locations"]`);
      listInputLocation.forEach(input => {
        if(input.checked) {
          locations.push(input.value);
        }
      })
      // End locations

      // schedules
      const listScheduleItem = tourCreateForm.querySelectorAll(".inner-schedule-item");
      listScheduleItem.forEach(item => {
        const input = item.querySelector(".inner-schedule-head input");
        const title = input.value;

        const textarea = item.querySelector(".inner-schedule-body textarea");
        const id = textarea.id;
        const description = getEditorContent(id);
        schedules.push({
          title: title,
          description: description
        });
      })
      // End schedules

      // Tạo FormData
      const formData = new FormData();
      appendImageRemoval(formData);
      formData.append("name", name);
      formData.append("category", category);
      formData.append("position", position);
      formData.append("status", status);
      if(avatar) formData.append("avatar", avatar);
      formData.append("priceAdult", priceAdult);
      formData.append("priceChildren", priceChildren);
      formData.append("priceBaby", priceBaby);
      formData.append("priceNewAdult", priceNewAdult);
      formData.append("priceNewChildren", priceNewChildren);
      formData.append("priceNewBaby", priceNewBaby);
      formData.append("stockAdult", stockAdult);
      formData.append("stockChildren", stockChildren);
      formData.append("stockBaby", stockBaby);
      formData.append("locations", JSON.stringify(locations));
      formData.append("time", time);
      formData.append("vehicle", vehicle);
      formData.append("departureDate", departureDate);
      formData.append("information", information);
      formData.append("schedules", JSON.stringify(schedules));
      formData.append("clearImages", String(filePondMulti.images.getFiles().length === 0));

      // images
      if(filePondMulti.images.getFiles().length > 0) {
        filePondMulti.images.getFiles().forEach(item => {
          formData.append("images", item.file);
        })
      }
      // End images

      fetch(`/${pathAdmin}/tour/create`, {
        method: "POST",
        body: formData
      })
        .then(res => res.json())
        .then(data => {
          if(data.code == "error") {
            notify.error(data.message);
          }

          if(data.code == "success") {
            if(data.code !== "success") return notify.error(data.message);
            drawNotify(data.code, data.message);
            window.location.reload();
          }
        })
    })
}
// End Tour Create Form

// Tour Edit Form
const tourEditForm = document.querySelector("#tour-edit-form");
if(tourEditForm) {
  const validator = new JustValidate('#tour-edit-form');

  validator
    .addField('#name', [
      {
        rule: 'required',
        errorMessage: "Vui lòng nhập tên tour!"
      },
    ])
    .onSuccess((event) => {
      const id = event.target.elements.namedItem("id").value;
      const name = event.target.elements.namedItem("name").value;
      const category = event.target.elements.namedItem("category").value;
      const position = event.target.elements.namedItem("position").value;
      const status = event.target.elements.namedItem("status").value;
      const avatar = getUploadFile("avatar");
      const priceAdult = event.target.elements.namedItem("priceAdult").value;
      const priceChildren = event.target.elements.namedItem("priceChildren").value;
      const priceBaby = event.target.elements.namedItem("priceBaby").value;
      const priceNewAdult = event.target.elements.namedItem("priceNewAdult").value;
      const priceNewChildren = event.target.elements.namedItem("priceNewChildren").value;
      const priceNewBaby = event.target.elements.namedItem("priceNewBaby").value;
      const stockAdult = event.target.elements.namedItem("stockAdult").value;
      const stockChildren = event.target.elements.namedItem("stockChildren").value;
      const stockBaby = event.target.elements.namedItem("stockBaby").value;
      const locations = [];
      const time = event.target.elements.namedItem("time").value;
      const vehicle = event.target.elements.namedItem("vehicle").value;
      const departureDate = event.target.elements.namedItem("departureDate").value;
      const information = getEditorContent("information");
      const schedules = [];

      // locations
      const listInputLocation = tourEditForm.querySelectorAll(`input[name="locations"]`);
      listInputLocation.forEach(input => {
        if(input.checked) {
          locations.push(input.value);
        }
      })
      // End locations

      // schedules
      const listScheduleItem = tourEditForm.querySelectorAll(".inner-schedule-item");
      listScheduleItem.forEach(item => {
        const input = item.querySelector(".inner-schedule-head input");
        const title = input.value;

        const textarea = item.querySelector(".inner-schedule-body textarea");
        const id = textarea.id;
        const description = getEditorContent(id);
        schedules.push({
          title: title,
          description: description
        });
      })
      // End schedules

      // Tạo FormData
      const formData = new FormData();
      appendImageRemoval(formData);
      formData.append("name", name);
      formData.append("updatedAt", event.target.elements.namedItem("updatedAt").value);
      formData.set("clearAvatar", String(filePond.avatar.getFiles().length === 0));
      formData.append("category", category);
      formData.append("position", position);
      formData.append("status", status);
      if(avatar) formData.append("avatar", avatar);
      formData.append("priceAdult", priceAdult);
      formData.append("priceChildren", priceChildren);
      formData.append("priceBaby", priceBaby);
      formData.append("priceNewAdult", priceNewAdult);
      formData.append("priceNewChildren", priceNewChildren);
      formData.append("priceNewBaby", priceNewBaby);
      formData.append("stockAdult", stockAdult);
      formData.append("stockChildren", stockChildren);
      formData.append("stockBaby", stockBaby);
      formData.append("locations", JSON.stringify(locations));
      formData.append("time", time);
      formData.append("vehicle", vehicle);
      formData.append("departureDate", departureDate);
      formData.append("information", information);
      formData.append("schedules", JSON.stringify(schedules));
      formData.append("clearImages", String(filePondMulti.images.getFiles().length === 0));

      const imageOrder = [];
      let uploadIndex = 0;
      filePondMulti.images.getFiles().forEach(item => {
        const originalUrl = item.getMetadata("originalUrl");
        if(originalUrl) imageOrder.push(originalUrl);
        else {
          imageOrder.push(uploadIndex++);
          formData.append("images", item.file);
        }
      });
      formData.append("imageOrder", JSON.stringify(imageOrder));

      fetch(`/${pathAdmin}/tour/edit/${id}`, {
        method: "PATCH",
        body: formData
      })
        .then(res => res.json())
        .then(data => {
          if(data.code == "error") {
            notify.error(data.message);
          }

          if(data.code == "success") {
            event.target.elements.namedItem("updatedAt").value = data.updatedAt;
            if(data.avatar && filePond.avatar.getFile()) filePond.avatar.getFile().setMetadata("originalUrl", data.avatar);
            filePondMulti.images.getFiles().forEach((item, index) => item.setMetadata("originalUrl", data.images[index]));
            notify.success(data.message);
          }
        })
    })
}
// End Tour Edit Form

// Order Edit Form
const orderEditForm = document.querySelector("#order-edit-form");
if(orderEditForm) {
  const validator = new JustValidate('#order-edit-form');

  validator
    .addField('#fullName', [
      {
        rule: 'required',
        errorMessage: "Vui lòng nhập họ tên!"
      },
      {
        rule: 'minLength',
        value: 5,
        errorMessage: "Họ tên phải có ít nhất 5 ký tự!"
      },
      {
        rule: 'maxLength',
        value: 50,
        errorMessage: "Họ tên không được vượt quá 50 ký tự!"
      },
    ])
    .addField('#phone', [
      {
        rule: 'required',
        errorMessage: "Vui lòng nhập số điện thoại!"
      },
      {
        rule: 'customRegexp',
        value: /^(0?)(3[2-9]|5[6|8|9]|7[0|6-9]|8[0-6|8|9]|9[0-4|6-9])[0-9]{7}$/,
        errorMessage: "Số điện thoại không đúng định dạng!"
      },
    ])
    .onSuccess((event) => {
      const id = event.target.elements.namedItem("id").value;
      const fullName = event.target.elements.namedItem("fullName").value;
      const phone = event.target.elements.namedItem("phone").value;
      const note = event.target.elements.namedItem("note").value;
      const paymentMethod = event.target.elements.namedItem("paymentMethod").value;
      const paymentStatus = event.target.elements.namedItem("paymentStatus").value;
      const status = event.target.elements.namedItem("status").value;

      const dataFinal = {
        fullName: fullName,
        phone: phone,
        note: note,
        paymentMethod: paymentMethod,
        paymentStatus: paymentStatus,
        status: status
      };

      fetch(`/${pathAdmin}/order/edit/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(dataFinal),
      })
        .then(res => res.json())
        .then(data => {
          if(data.code == "error") {
            notify.error(data.message);
          }

          if(data.code == "success") {
            notify.success(data.message);
          }
        })
    })
}
// End Order Edit Form

// Setting Website Info Form
const settingWebsiteInfoForm = document.querySelector("#setting-website-info-form");
if(settingWebsiteInfoForm) {
  const validator = new JustValidate('#setting-website-info-form');

  validator
    .addField('#websiteName', [
      {
        rule: 'required',
        errorMessage: "Vui lòng nhập tên website!"
      },
    ])
    .addField('#email', [
      {
        rule: 'email',
        errorMessage: "Email không đúng định dạng!"
      },
    ])
    .onSuccess((event) => {
      const websiteName = event.target.elements.namedItem("websiteName").value;
      const phone = event.target.elements.namedItem("phone").value;
      const email = event.target.elements.namedItem("email").value;
      const address = event.target.elements.namedItem("address").value;
      const logo = getUploadFile("logo");
      const favicon = getUploadFile("favicon");
      const categoryIdSection4 = event.target.elements.namedItem("categoryIdSection4").value;

      // Tạo FormData
      const formData = new FormData();
      appendImageRemoval(formData);
      formData.append("websiteName", websiteName);
      for(const field of ["bankName", "bankAccountName", "bankAccountNumber"]) formData.append(field, event.target[field].value);
      formData.append("phone", phone);
      formData.append("email", email);
      formData.append("address", address);
      if(logo) formData.append("logo", logo);
      if(favicon) formData.append("favicon", favicon);
      formData.append("categoryIdSection4", categoryIdSection4);

      fetch(`/${pathAdmin}/setting/website-info`, {
        method: "PATCH",
        body: formData,
      })
        .then(res => res.json())
        .then(data => {
          if(data.code == "error") {
            notify.error(data.message);
          }

          if(data.code == "success") {
            notify.success(data.message);
          }
        })
    })
}
// End Setting Website Info Form

// Setting Account Admin Create Form
const settingAccountAdminCreateForm = document.querySelector("#setting-account-admin-create-form");
if(settingAccountAdminCreateForm) {
  const validator = new JustValidate('#setting-account-admin-create-form');

  validator
    .addField('#fullName', [
      {
        rule: 'required',
        errorMessage: "Vui lòng nhập họ tên!"
      },
      {
        rule: 'minLength',
        value: 5,
        errorMessage: "Họ tên phải có ít nhất 5 ký tự!"
      },
      {
        rule: 'maxLength',
        value: 50,
        errorMessage: "Họ tên không được vượt quá 50 ký tự!"
      },
    ])
    .addField('#email', [
      {
        rule: 'required',
        errorMessage: "Vui lòng nhập email!"
      },
      {
        rule: 'email',
        errorMessage: "Email không đúng định dạng!"
      },
    ])
    .addField('#phone', [
      {
        rule: 'required',
        errorMessage: "Vui lòng nhập số điện thoại!"
      },
      {
        rule: 'customRegexp',
        value: /^(0?)(3[2-9]|5[6|8|9]|7[0|6-9]|8[0-6|8|9]|9[0-4|6-9])[0-9]{7}$/,
        errorMessage: "Số điện thoại không đúng định dạng!"
      },
    ])
    .addField('#password', [
      {
        rule: 'required',
        errorMessage: "Vui lòng nhập mật khẩu!"
      },
      {
        rule: 'minLength',
        value: 8,
        errorMessage: "Mật khẩu phải có ít nhất 8 ký tự!"
      },
      {
        rule: 'customRegexp',
        value: /[A-Z]/,
        errorMessage: "Mật khẩu phải có ít nhất một chữ cái viết hoa!"
      },
      {
        rule: 'customRegexp',
        value: /[a-z]/,
        errorMessage: "Mật khẩu phải có ít nhất một chữ cái viết thường!"
      },
      {
        rule: 'customRegexp',
        value: /\d/,
        errorMessage: "Mật khẩu phải có ít nhất một chữ số!"
      },
      {
        rule: 'customRegexp',
        value: /[~!@#$%^&*]/,
        errorMessage: "Mật khẩu phải có ít nhất một ký tự đặc biệt! (~!@#$%^&*)"
      },
    ])
    .onSuccess((event) => {
      const fullName = event.target.elements.namedItem("fullName").value;
      const email = event.target.elements.namedItem("email").value;
      const phone = event.target.elements.namedItem("phone").value;
      const role = event.target.elements.namedItem("role").value;
      const positionCompany = event.target.elements.namedItem("positionCompany").value;
      const status = event.target.elements.namedItem("status").value;
      const password = event.target.elements.namedItem("password").value;
      const avatar = getUploadFile("avatar");

      // Tạo FormData
      const formData = new FormData();
      appendImageRemoval(formData);
      formData.append("fullName", fullName);
      formData.append("email", email);
      formData.append("phone", phone);
      formData.append("role", role);
      formData.append("positionCompany", positionCompany);
      formData.append("status", status);
      formData.append("password", password);
      if(avatar) formData.append("avatar", avatar);

      fetch(`/${pathAdmin}/setting/account-admin/create`, {
        method: "POST",
        body: formData
      })
        .then(res => res.json())
        .then(data => {
          if(data.code == "error") {
            notify.error(data.message);
          }

          if(data.code == "success") {
            if(data.code !== "success") return notify.error(data.message);
            drawNotify(data.code, data.message);
            window.location.reload();
          }
        })
    })
}
// End Setting Account Admin Create Form

// Setting Account Admin Edit Form
const settingAccountAdminEditForm = document.querySelector("#setting-account-admin-edit-form");
if(settingAccountAdminEditForm) {
  const validator = new JustValidate('#setting-account-admin-edit-form');

  validator
    .addField('#fullName', [
      {
        rule: 'required',
        errorMessage: "Vui lòng nhập họ tên!"
      },
      {
        rule: 'minLength',
        value: 5,
        errorMessage: "Họ tên phải có ít nhất 5 ký tự!"
      },
      {
        rule: 'maxLength',
        value: 50,
        errorMessage: "Họ tên không được vượt quá 50 ký tự!"
      },
    ])
    .addField('#email', [
      {
        rule: 'required',
        errorMessage: "Vui lòng nhập email!"
      },
      {
        rule: 'email',
        errorMessage: "Email không đúng định dạng!"
      },
    ])
    .addField('#phone', [
      {
        rule: 'required',
        errorMessage: "Vui lòng nhập số điện thoại!"
      },
      {
        rule: 'customRegexp',
        value: /^(0?)(3[2-9]|5[6|8|9]|7[0|6-9]|8[0-6|8|9]|9[0-4|6-9])[0-9]{7}$/,
        errorMessage: "Số điện thoại không đúng định dạng!"
      },
    ])
    .addField('#password', [
      {
        rule: 'minLength',
        value: 8,
        errorMessage: "Mật khẩu phải có ít nhất 8 ký tự!"
      },
      {
        rule: 'customRegexp',
        value: /[A-Z]/,
        errorMessage: "Mật khẩu phải có ít nhất một chữ cái viết hoa!"
      },
      {
        rule: 'customRegexp',
        value: /[a-z]/,
        errorMessage: "Mật khẩu phải có ít nhất một chữ cái viết thường!"
      },
      {
        rule: 'customRegexp',
        value: /\d/,
        errorMessage: "Mật khẩu phải có ít nhất một chữ số!"
      },
      {
        rule: 'customRegexp',
        value: /[~!@#$%^&*]/,
        errorMessage: "Mật khẩu phải có ít nhất một ký tự đặc biệt! (~!@#$%^&*)"
      },
    ])
    .onSuccess((event) => {
      const id = event.target.elements.namedItem("id").value;
      const fullName = event.target.elements.namedItem("fullName").value;
      const email = event.target.elements.namedItem("email").value;
      const phone = event.target.elements.namedItem("phone").value;
      const role = event.target.elements.namedItem("role").value;
      const positionCompany = event.target.elements.namedItem("positionCompany").value;
      const status = event.target.elements.namedItem("status").value;
      const password = event.target.elements.namedItem("password").value;
      const avatar = getUploadFile("avatar");

      // Tạo FormData
      const formData = new FormData();
      appendImageRemoval(formData);
      formData.append("fullName", fullName);
      formData.append("email", email);
      formData.append("phone", phone);
      formData.append("role", role);
      formData.append("positionCompany", positionCompany);
      formData.append("status", status);
      formData.append("password", password);
      if(avatar) formData.append("avatar", avatar);

      fetch(`/${pathAdmin}/setting/account-admin/edit/${id}`, {
        method: "PATCH",
        body: formData
      })
        .then(res => res.json())
        .then(data => {
          if(data.code == "error") {
            notify.error(data.message);
          }

          if(data.code == "success") {
            notify.success(data.message);
          }
        })
    })
}
// End Setting Account Admin Edit Form

// Setting Role Create Form
const settingRoleCreateForm = document.querySelector("#setting-role-create-form");
if(settingRoleCreateForm) {
  const validator = new JustValidate('#setting-role-create-form');

  validator
    .addField('#name', [
      {
        rule: 'required',
        errorMessage: "Vui lòng nhập tên nhóm quyền!"
      },
    ])
    .onSuccess((event) => {
      const name = event.target.elements.namedItem("name").value;
      const description = event.target.elements.namedItem("description").value;
      const permissions = [];

      // permissions
      const listInputPermission = settingRoleCreateForm.querySelectorAll(`input[name="permissions"]`);
      listInputPermission.forEach(input => {
        if(input.checked) {
          permissions.push(input.value);
        }
      })
      // End permissions

      const dataFinal = {
        name: name,
        description: description,
        permissions: permissions
      };

      fetch(`/${pathAdmin}/setting/role/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(dataFinal)
      })
        .then(res => res.json())
        .then(data => {
          if(data.code == "error") {
            notify.error(data.message);
          }

          if(data.code == "success") {
            if(data.code !== "success") return notify.error(data.message);
            drawNotify(data.code, data.message);
            window.location.reload();
          }
        })
    })
}
// End Setting Role Create Form

// Setting Role Edit Form
const settingRoleEditForm = document.querySelector("#setting-role-edit-form");
if(settingRoleEditForm) {
  const validator = new JustValidate('#setting-role-edit-form');

  validator
    .addField('#name', [
      {
        rule: 'required',
        errorMessage: "Vui lòng nhập tên nhóm quyền!"
      },
    ])
    .onSuccess((event) => {
      const id = event.target.elements.namedItem("id").value;
      const name = event.target.elements.namedItem("name").value;
      const description = event.target.elements.namedItem("description").value;
      const permissions = [];

      // permissions
      const listInputPermission = settingRoleEditForm.querySelectorAll(`input[name="permissions"]`);
      listInputPermission.forEach(input => {
        if(input.checked) {
          permissions.push(input.value);
        }
      })
      // End permissions

      const dataFinal = {
        name: name,
        description: description,
        permissions: permissions
      };

      fetch(`/${pathAdmin}/setting/role/edit/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(dataFinal)
      })
        .then(res => res.json())
        .then(data => {
          if(data.code == "error") {
            notify.error(data.message);
          }

          if(data.code == "success") {
            notify.success(data.message);
          }
        })
    })
}
// End Setting Role Edit Form

// Profile Edit Form
const profileEditForm = document.querySelector("#profile-edit-form");
if(profileEditForm) {
  const validator = new JustValidate('#profile-edit-form');

  validator
    .addField('#fullName', [
      {
        rule: 'required',
        errorMessage: "Vui lòng nhập họ tên!"
      },
      {
        rule: 'minLength',
        value: 5,
        errorMessage: "Họ tên phải có ít nhất 5 ký tự!"
      },
      {
        rule: 'maxLength',
        value: 50,
        errorMessage: "Họ tên không được vượt quá 50 ký tự!"
      },
    ])
    .addField('#email', [
      {
        rule: 'required',
        errorMessage: "Vui lòng nhập email!"
      },
      {
        rule: 'email',
        errorMessage: "Email không đúng định dạng!"
      },
    ])
    .addField('#phone', [
      {
        rule: 'required',
        errorMessage: "Vui lòng nhập số điện thoại!"
      },
      {
        rule: 'customRegexp',
        value: /^(0?)(3[2-9]|5[6|8|9]|7[0|6-9]|8[0-6|8|9]|9[0-4|6-9])[0-9]{7}$/,
        errorMessage: "Số điện thoại không đúng định dạng!"
      },
    ])
    .onSuccess((event) => {
      const fullName = event.target.elements.namedItem("fullName").value;
      const email = event.target.elements.namedItem("email").value;
      const phone = event.target.elements.namedItem("phone").value;
      const avatar = getUploadFile("avatar");

      // Tạo FormData
      const formData = new FormData();
      appendImageRemoval(formData);
      formData.append("fullName", fullName);
      formData.append("email", email);
      formData.append("phone", phone);
      if(avatar) formData.append("avatar", avatar);

      fetch(`/${pathAdmin}/profile/edit`, {
        method: "PATCH",
        body: formData
      })
        .then(res => res.json())
        .then(data => {
          if(data.code == "error") {
            notify.error(data.message);
          }

          if(data.code == "success") {
            if(data.code !== "success") return notify.error(data.message);
            drawNotify(data.code, data.message);
            window.location.reload();
          }
        })
    })
}
// End Profile Edit Form

// Profile Change Password Form
const profileChangePasswordForm = document.querySelector("#profile-change-password-form");
if(profileChangePasswordForm) {
  const validator = new JustValidate('#profile-change-password-form');

  validator
    .addField('#password', [
      {
        rule: 'required',
        errorMessage: "Vui lòng nhập mật khẩu mới!"
      },
      {
        rule: 'minLength',
        value: 8,
        errorMessage: "Mật khẩu phải có ít nhất 8 ký tự!"
      },
      {
        rule: 'customRegexp',
        value: /[A-Z]/,
        errorMessage: "Mật khẩu phải có ít nhất một chữ cái viết hoa!"
      },
      {
        rule: 'customRegexp',
        value: /[a-z]/,
        errorMessage: "Mật khẩu phải có ít nhất một chữ cái viết thường!"
      },
      {
        rule: 'customRegexp',
        value: /\d/,
        errorMessage: "Mật khẩu phải có ít nhất một chữ số!"
      },
      {
        rule: 'customRegexp',
        value: /[~!@#$%^&*]/,
        errorMessage: "Mật khẩu phải có ít nhất một ký tự đặc biệt! (~!@#$%^&*)"
      },
    ])
    .addField('#confirmPassword', [
      {
        validator: (value, fields) => {
          const password = fields["#password"].elem.value;
          return password == value;
        },
        errorMessage: "Mật khẩu xác nhận không khớp!"
      }
    ])
    .onSuccess((event) => {
      const password = event.target.elements.namedItem("password").value;

      const dataFinal = {
        password: password
      };

      fetch(`/${pathAdmin}/profile/change-password`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(dataFinal)
      })
        .then(res => res.json())
        .then(data => {
          if(data.code == "error") {
            notify.error(data.message);
          }

          if(data.code == "success") {
            drawNotify(data.code, data.message);
            window.location.href = `/${pathAdmin}/account/login`;
          }
        })
    })
}
// End Profile Change Password Form

// Sider
const sider = document.querySelector(".sider");
if(sider) {
  const pathNameCurrent = location.pathname;
  const splitPathNameCurrent = pathNameCurrent.split("/");
  const menuList = sider.querySelectorAll("a");
  menuList.forEach(item => {
    const href = item.getAttribute("href");
    const splitHref = href.split("/");
    if(splitPathNameCurrent[1] == splitHref[1] && splitPathNameCurrent[2] == splitHref[2]) {
      item.classList.add("active");
    }
  })
}
// End Sider

// Logout
const buttonLogout = document.querySelector(".sider .inner-logout");
if(buttonLogout) {
  buttonLogout.addEventListener("click", () => {
    fetch(`/${pathAdmin}/account/logout`, {
      method: "POST"
    })
      .then(res => res.json())
      .then(data => {
        drawNotify(data.code, data.message);
        window.location.href = `/${pathAdmin}/account/login`;
      })
  })
}
// End Logout

// Button Delete
const listButtonDelete = document.querySelectorAll("[button-delete]");
if(listButtonDelete.length > 0) {
  listButtonDelete.forEach(button => {
    button.addEventListener("click", () => {
      const dataApi = button.getAttribute("data-api");

      fetch(dataApi, {
        method: "PATCH"
      })
        .then(res => res.json())
        .then(data => {
          if(data.code !== "success") return notify.error(data.message);
          drawNotify(data.code, data.message);
          window.location.reload();
        })
    })
  })
}
// End Button Delete

// Button Undo
const listButtonUndo = document.querySelectorAll("[button-undo]");
if(listButtonUndo.length > 0) {
  listButtonUndo.forEach(button => {
    button.addEventListener("click", () => {
      const dataApi = button.getAttribute("data-api");

      fetch(dataApi, {
        method: "PATCH"
      })
        .then(res => res.json())
        .then(data => {
          if(data.code !== "success") return notify.error(data.message);
          drawNotify(data.code, data.message);
          window.location.reload();
        })
    })
  })
}
// End Button Undo

// Button Destroy
const listButtonDestroy = document.querySelectorAll("[button-destroy]");
if(listButtonDestroy.length > 0) {
  listButtonDestroy.forEach(button => {
    button.addEventListener("click", () => {
      const isConfirm = confirm("Bạn có chắc chắn muốn xóa? Hành động này sẽ không thể khôi phục lại bản ghi.");

      if(isConfirm) {
        const dataApi = button.getAttribute("data-api");

        fetch(dataApi, {
          method: "DELETE"
        })
          .then(res => res.json())
          .then(data => {
            if(data.code !== "success") return notify.error(data.message);
            drawNotify(data.code, data.message);
            window.location.reload();
          })
      }
    })
  })
}
// End Button Destroy

// Filter Status
const filterStatus = document.querySelector("[filter-status]");
if(filterStatus) {
  const url = new URL(window.location.href);

  filterStatus.addEventListener("change", () => {
    const value = filterStatus.value;
    if(value) {
      url.searchParams.delete("page");
      url.searchParams.set("status", value);
    } else {
      url.searchParams.delete("status");
    }
    window.location.href = url.href;
  })

  // Hiển thị giá trị mặc định
  const valueCurrent = url.searchParams.get("status");
  if(valueCurrent) {
    filterStatus.value = valueCurrent;
  }
}
// End Filter Status

// Filter Created By
const filterCreatedBy = document.querySelector("[filter-created-by]");
if(filterCreatedBy) {
  const url = new URL(window.location.href);

  filterCreatedBy.addEventListener("change", () => {
    const value = filterCreatedBy.value;
    if(value) {
      url.searchParams.delete("page");
      url.searchParams.set("createdBy", value);
    } else {
      url.searchParams.delete("createdBy");
    }
    window.location.href = url.href;
  })

  // Hiển thị giá trị mặc định
  const valueCurrent = url.searchParams.get("createdBy");
  if(valueCurrent) {
    filterCreatedBy.value = valueCurrent;
  }
}
// End Filter Created By

// Filter Start Date
const filterStartDate = document.querySelector("[filter-start-date]");
if(filterStartDate) {
  const url = new URL(window.location.href);

  filterStartDate.addEventListener("change", () => {
    const value = filterStartDate.value;
    if(value) {
      url.searchParams.delete("page");
      url.searchParams.set("startDate", value);
    } else {
      url.searchParams.delete("startDate");
    }
    window.location.href = url.href;
  })

  // Hiển thị giá trị mặc định
  const valueCurrent = url.searchParams.get("startDate");
  if(valueCurrent) {
    filterStartDate.value = valueCurrent;
  }
}
// End Filter Start Date

// Filter End Date
const filterEndDate = document.querySelector("[filter-end-date]");
if(filterEndDate) {
  const url = new URL(window.location.href);

  filterEndDate.addEventListener("change", () => {
    const value = filterEndDate.value;
    if(value) {
      url.searchParams.delete("page");
      url.searchParams.set("endDate", value);
    } else {
      url.searchParams.delete("endDate");
    }
    window.location.href = url.href;
  })

  // Hiển thị giá trị mặc định
  const valueCurrent = url.searchParams.get("endDate");
  if(valueCurrent) {
    filterEndDate.value = valueCurrent;
  }
}
// End Filter End Date

// Filter Reset
const filterReset = document.querySelector("[filter-reset]");
if(filterReset) {
  const url = new URL(window.location.href);
  const listName = [
    "status",
    "createdBy",
    "startDate",
    "endDate", "category", "keyword", "page"
  ];

  filterReset.addEventListener("click", () => {
    listName.forEach(name => {
      url.searchParams.delete(name);
    })
    window.location.href = url.href;
  })
}
// End Filter Reset

// Check All
const checkAll = document.querySelector("[check-all]");
if(checkAll) {
  checkAll.addEventListener("click", () => {
    const listCheckItem = document.querySelectorAll("[check-item]");
    listCheckItem.forEach(item => {
      item.checked = checkAll.checked;
    })
  })
}
// End Check All

// Change Multi
const changeMulti = document.querySelector("[change-multi]");
if(changeMulti) {
  const select = changeMulti.querySelector("select");
  const button = changeMulti.querySelector("button");
  const dataApi = changeMulti.getAttribute("data-api");

  button.addEventListener("click", () => {
    const value = select.value;
    const ids = [];

    const listInputChecked = document.querySelectorAll("[check-item]:checked");
    listInputChecked.forEach(input => {
      const id = input.getAttribute("check-item");
      ids.push(id);
    })

    if(value && ids.length > 0) {
      const dataFinal = {
        value: value,
        ids: ids
      };

      fetch(dataApi, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(dataFinal)
      })
        .then(res => res.json())
        .then(data => {
          if(data.code !== "success") return notify.error(data.message);
          drawNotify(data.code, data.message);
          window.location.reload();
        })
    }
  })
}
// End Change Multi

// Search
const search = document.querySelector("[search]");
if(search) {
  const url = new URL(window.location.href);

  search.addEventListener("keyup", (event) => {
    if(event.code == "Enter") {
      const value = search.value;
      if(value) {
        url.searchParams.delete("page");
      url.searchParams.set("keyword", value);
      } else {
        url.searchParams.delete("keyword");
      }
      window.location.href = url.href;
    }
  })

  // Hiển thị giá trị mặc định
  const valueCurrent = url.searchParams.get("keyword");
  if(valueCurrent) {
    search.value = valueCurrent;
  }
}
// End Search

// Box Pagination
const boxPagination = document.querySelector("[box-pagination]");
if(boxPagination) {
  const url = new URL(window.location.href);

  boxPagination.addEventListener("change", () => {
    const value = boxPagination.value;
    if(value) {
      url.searchParams.delete("page");
      url.searchParams.set("page", value);
    } else {
      url.searchParams.delete("page");
    }
    window.location.href = url.href;
  })

  // Hiển thị giá trị mặc định
  const valueCurrent = url.searchParams.get("page");
  if(valueCurrent) {
    boxPagination.value = valueCurrent;
  }
}
// End Box Pagination
// Active navigation
const currentPath = window.location.pathname;
document.querySelectorAll(".sider a[href]").forEach(link => {
  const href = link.getAttribute("href");
  if(href && href !== "/" && (currentPath === href || currentPath.startsWith(href.replace(/\/(list|create)$/, "") + "/"))) {
    link.classList.add("active"); link.setAttribute("aria-current", "page");
  }
});

// Category filter
const filterCategory = document.querySelector("[filter-category]");
if(filterCategory) {
  const url = new URL(window.location.href);
  filterCategory.value = url.searchParams.get("category") || "";
  filterCategory.addEventListener("change", () => {
    url.searchParams.delete("page");
    if(filterCategory.value) url.searchParams.set("category", filterCategory.value);
    else url.searchParams.delete("category");
    window.location.href = url.href;
  });
}

const couponAdminForm = document.querySelector("#coupon-admin-form");
if(couponAdminForm) couponAdminForm.addEventListener("submit", async event => {
  event.preventDefault();
  const body = Object.fromEntries(new FormData(couponAdminForm));
  body.expiresAt = new Date(body.expiresAt).toISOString();
  for(const key of ["percent", "minTotal", "maxDiscount"]) body[key] = Number(body[key]);
  try {
    const response = await fetch(`/${pathAdmin}/coupon/save`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const data = await response.json();
    if(data.code !== "success") return notify.error(data.message);
    drawNotify(data.code, data.message); window.location.reload();
  } catch { notify.error("Không thể kết nối máy chủ."); }
});
document.querySelectorAll(".coupon-toggle").forEach(button => button.addEventListener("click", async () => {
  try {
    const response = await fetch(`/${pathAdmin}/coupon/${button.dataset.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: button.dataset.status === "active" ? "inactive" : "active" }) });
    const data = await response.json();
    if(data.code !== "success") return notify.error(data.message);
    window.location.reload();
  } catch { notify.error("Không thể kết nối máy chủ."); }
}));

// Empty lists and accessible icon actions
for(const table of document.querySelectorAll(".table-1 table, .table-2 table")) {
  const body = table.querySelector("tbody");
  if(body && !body.children.length) {
    const row = body.insertRow(), cell = row.insertCell();
    cell.colSpan = table.querySelectorAll("thead th").length;
    cell.className = "empty-cell"; cell.textContent = "Chưa có dữ liệu phù hợp.";
  }
}
document.querySelectorAll(".inner-buttons .inner-edit, .inner-buttons .inner-delete").forEach(button => {
  const label = button.classList.contains("inner-delete") ? "Xóa bản ghi" : "Chỉnh sửa bản ghi";
  button.setAttribute("aria-label", label); button.title = label;
});

// Số tour đã chọn trên trang hiện tại.
const updateSelectionCount = () => {
  const label = document.querySelector(".selection-count");
  if(label) {
    const count = document.querySelectorAll("[check-item]:checked").length;
    label.textContent = count ? `Đã chọn ${count} tour` : "Chọn tour để thao tác hàng loạt";
  }
};
document.querySelectorAll("[check-all], [check-item]").forEach(input => input.addEventListener("change", updateSelectionCount));
