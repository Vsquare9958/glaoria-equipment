// (function () {
//   const form = document.getElementById('enquiryForm');
//   const successPanel = document.getElementById('successPanel');
//   const emailServiceId = 'service_zjf230n';
//   const emailTemplateId = 'template_9k5v1zf';
//   const emailUserId = 'EnbwlrtFKcRL0Xd0m';

//   emailjs.init(emailUserId);

//   const typeMap = { feasibility: 'feasibility', prototype: 'prototype', enterprise: 'enterprise' };
//   const params = new URLSearchParams(window.location.search);
//   const type = typeMap[params.get('type')];
//   if (type) {
//     const engagementSelect = document.getElementById('engagementType');
//     if (engagementSelect) engagementSelect.value = type;
//   }

//   function buildTemplateParams(data) {
//     return {
//       full_name: data.fullName || '[not provided]',
//       job_title: data.jobTitle || '[not provided]',
//       work_email: data.email || '[not provided]',
//       phone_number: data.phone || '[not provided]',
//       company: data.company || '[not provided]',
//       location: data.location || '[not provided]',
//       problem_statement: data.problemStatement || '[not provided]',
//       focus_area: data.focusArea || '[not provided]',
//       engagement_type: data.engagementType || '[not provided]',
//       timeline: data.timeline || '[not provided]',
//       budget: data.budget || '[not provided]',
//       additional_info: data.additionalInfo || '[not provided]',
//       consent: data.consent ? 'Yes' : 'No',
//     };
//   }

//   form.addEventListener('submit', function (e) {
//     e.preventDefault();

//     if (!form.checkValidity()) {
//       form.reportValidity();
//       return;
//     }

//     const data = Object.fromEntries(new FormData(form));
//     const templateParams = buildTemplateParams(data);

//     emailjs.send(emailServiceId, emailTemplateId, templateParams)
//       .then(function () {
//         form.classList.add('submitted');
//         if (successPanel) {
//           successPanel.classList.add('visible');
//         }
//         window.scrollTo({ top: 0, behavior: 'smooth' });
//       }, function (error) {
//         console.error('EmailJS send error:', error);
//         alert('There was a problem sending your enquiry. Please try again later.');
//       });
//   });
// })();

(function () {
  const form = document.getElementById('enquiryForm');
  const successPanel = document.getElementById('successPanel');
  const submitBtn = form.querySelector('button[type="submit"]');

  // Parse URL query parameters for pre-filling engagement type
  const typeMap = { feasibility: 'feasibility', prototype: 'prototype', enterprise: 'enterprise' };
  const params = new URLSearchParams(window.location.search);
  const type = typeMap[params.get('type')];
  if (type) {
    const engagementSelect = document.getElementById('engagementType');
    if (engagementSelect) engagementSelect.value = type;
  }

  form.addEventListener('submit', async function (e) {
    e.preventDefault();

    // Prevent double-click submissions
    if (submitBtn.disabled) return;

    // Trigger standard browser validation
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    // PDF Attachment Client-Side Validation
    // const fileInput = document.getElementById('attachment');
    // if (fileInput && fileInput.files.length > 0) {
    //   const file = fileInput.files[0];
    //   const maxSizeBytes = 5 * 1024 * 1024; // 5 MB

    //   if (file.type !== 'application/pdf') {
    //     alert('Please attach a valid PDF document.');
    //     return;
    //   }

    //   if (file.size > maxSizeBytes) {
    //     alert('The attached PDF file size must be less than 5MB.');
    //     return;
    //   }
    // }


    // Capture form field values
    const formData = new FormData(form);
    const object = Object.fromEntries(formData);
    const json = JSON.stringify(object);

    // Provide UI feedback on submission start
    const originalBtnText = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML = 'Sending...';

    // --- ABORTCONTROLLER SETUP ---
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10-second limit

    try {
      const response = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: json,
        signal: controller.signal // Pass the controller signal to fetch
      });

      // Clear the timeout timer immediately after fetch completes
      clearTimeout(timeoutId);

      const result = await response.json();

      if (response.status === 200) {

        if (typeof gtag === 'function') {
          gtag('event', 'generate_lead', {
            event_category: 'Enquiry',
            event_label: type || 'General'
          });
        }

        form.classList.add('submitted');
        if (successPanel) {
          successPanel.classList.add('visible');
          successPanel.setAttribute('tabindex', '-1');
          successPanel.focus();
        }
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        alert(result.message || 'Something went wrong. Please try again.');
      }
    } catch (error) {
      clearTimeout(timeoutId);
      console.error('Web3Forms submit error:', error);

      // Distinguish between a timeout abort and a normal network failure
      if (error.name === 'AbortError') {
        alert('The request timed out. Please check your internet connection and try again.');
      } else {
        alert('There was a problem submitting your enquiry. Please check your connection and try again.');
      }
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalBtnText;
    }
  });
})();