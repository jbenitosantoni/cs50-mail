document.addEventListener('DOMContentLoaded', function() {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);
  document.querySelector("#compose-form").addEventListener("submit", send_email);

  load_mailbox('inbox');
});

function compose_email() {
  // Show compose view and hide other views
  document.querySelector("#emails-view").style.display = "none";
  document.querySelector("#single-email-view").style.display = "none";
  document.querySelector("#compose-view").style.display = "block";

  // Clear out composition fields
  document.querySelector("#compose-recipients").value = "";
  document.querySelector("#compose-subject").value = "";
  document.querySelector("#compose-body").value = "";
}

function load_mailbox(mailbox, message = "") {
  document.querySelector("#message").value = "";

  document.querySelector("#emails-view").style.display = "block";
  document.querySelector("#compose-view").style.display = "none";
  document.querySelector("#single-email-view").style.display = "none";

  document.querySelector("#emails-view").innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;

  fetch(`/emails/${mailbox}`)
    .then((response) => response.json())
    .then((emails) => {
      emails.forEach((email) => {

        const parent_div = document.createElement("div");

        build_emails(email, parent_div, mailbox);

        parent_div.addEventListener("click", () => read_email(email["id"]));
        document.querySelector("#emails-view").appendChild(parent_div);

      });
    })
    .catch((error) => console.error(error));
}

function build_emails(item, parent_div, mailbox) {
  // If its archived and main inbox
  if ( item["archived"] && mailbox === "inbox") {
    return;
  }
  // If its not archived and archived inbox
  else if (!item["archived"] && mailbox === "archive") {
    return;
  }

  const content = document.createElement("div");

  const recipients = document.createElement("b");
  if (mailbox === "sent") {
    recipients.innerHTML = item["recipients"].join(", ");
  }
  else {
    recipients.innerHTML = item["sender"] + " ";
  }
  if (item["read"]) {
    parent_div.style.backgroundColor = "grey";
  }

  content.appendChild(recipients);

  content.innerHTML += item["subject"];

  const sent_date = document.createElement("div");
  sent_date.innerHTML = item["timestamp"];
  sent_date.style.display = "inline-block";
  sent_date.style.float = "right";
  sent_date.style.color = "black";

  content.appendChild(sent_date);
  content.style.padding = "15px";

  parent_div.appendChild(content);
  parent_div.style.borderStyle = "solid";
  parent_div.style.borderRadius = "15px 50px 30px 5px";
  parent_div.style.borderWidth = "3.5px";
  parent_div.style.margin = "15px";
}


function read_email(id) {
  document.querySelector("#emails-view").style.display = "none";
  document.querySelector("#single-email-view").innerHTML = "";
  document.querySelector("#single-email-view").style.display = "block";

  fetch(`/emails/${id}`)
    .then(response => response.json())
    .then(result => {
      build_email(result);
    })
    .catch(error => console.log(error));

  fetch(`/emails/${id}`, {
    method: "PUT",
    body: JSON.stringify({
      read: true
    })
  });
}

function build_email(data) {
  const from = document.createElement("div");
  const to = document.createElement("div");
  const subject = document.createElement("div");
  const sent_date = document.createElement("div");
  const reply_button = document.createElement("button");
  const archive_button = document.createElement("button");
  const body = document.createElement("div");

  from.innerHTML = `<strong>From: </strong> ${data["sender"]}`;
  to.innerHTML = `<strong>To: </strong> ${data["recipients"].join(", ")}`;
  subject.innerHTML = `<strong>Subject: </strong> ${data["subject"]}`;
  sent_date.innerHTML = `<strong>Timestamp: </strong> ${data["timestamp"]}`;
  body.innerHTML = data["body"];

  if (data["archived"]) {
    archive_button.innerHTML += "Unarchive";
  } else {
    archive_button.innerHTML += "Archive";
  }
  archive_button.classList = "btn btn-sm btn-outline-primary m-2";
  archive_button.addEventListener("click", () => {
    archive_email(data);
    load_mailbox("inbox");
  });


  reply_button.innerHTML = 'Reply';
  reply_button.classList = "btn btn-sm btn-outline-primary";
  reply_button.addEventListener("click", () => compose_reply(data));


  //Construct email in screen
  document.querySelector("#single-email-view").appendChild(from);
  document.querySelector("#single-email-view").appendChild(to);
  document.querySelector("#single-email-view").appendChild(subject);
  document.querySelector("#single-email-view").appendChild(sent_date);
  document.querySelector("#single-email-view").appendChild(archive_button);
  document.querySelector("#single-email-view").appendChild(reply_button);
  document.querySelector("#single-email-view").appendChild(document.createElement("hr"));
  document.querySelector("#single-email-view").appendChild(body);
}

function archive_email(data) {
  fetch(`/emails/${data["id"]}`, {
    method: "PUT",
    body: JSON.stringify({
      archived: !data["archived"]
    })
  });
}

function compose_reply(data) {
  document.querySelector("#emails-view").style.display = "none";
  document.querySelector("#single-email-view").style.display = "none";
  document.querySelector("#compose-view").style.display = "block";

  document.querySelector("#compose-recipients").value = data["sender"];
  document.querySelector("#compose-subject").value = ((data["subject"].match(/^(Re:)\s/)) ? data["subject"] : "Re: " + data["subject"]);
  document.querySelector("#compose-body").value = `On ${data["timestamp"]} ${data["sender"]} wrote:\n${data["body"]}\n-------------------------------------\n`;
}

function send_email(event) {
  event.preventDefault();

  const recipients = document.querySelector("#compose-recipients").value;
  const subject = document.querySelector("#compose-subject").value;
  const body = document.querySelector("#compose-body").value;

  fetch("/emails", {
    method: "POST",
    body: JSON.stringify({
      recipients: recipients,
      subject: subject,
      body: body,
    }),
  })
      .then((response) => response.json())
    .then((result) => {
      load_mailbox("sent", result);
    })
    .catch((error) => console.log(error));
}