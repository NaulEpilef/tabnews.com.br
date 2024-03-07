import email from 'infra/email.js';
import webserver from 'infra/webserver.js';
import authorization from 'models/authorization.js';
import content from 'models/content.js';
import { NotificationEmail } from 'models/transactional';
import user from 'models/user.js';

async function sendReplyEmailToParentUser(createdContent) {
  const anonymousUser = user.createAnonymous();
  const secureCreatedContent = authorization.filterOutput(anonymousUser, 'read:content', createdContent);

  const parentContent = await content.findOne({
    where: {
      id: secureCreatedContent.parent_id,
    },
  });

  if (parentContent.owner_id !== secureCreatedContent.owner_id) {
    const parentContentUser = await user.findOneById(parentContent.owner_id);

    if (parentContentUser.notifications === false) {
      return;
    }

    const childContendUrl = getChildContendUrl(secureCreatedContent);
    const rootContent = parentContent.parent_id
      ? await content.findOne({
          where: {
            id: parentContent.path[0],
          },
          attributes: { exclude: ['body'] },
        })
      : parentContent;

    const secureRootContent = authorization.filterOutput(anonymousUser, 'read:content', rootContent);

    const subject = getSubject({
      createdContent: secureCreatedContent,
      rootContent: secureRootContent,
    });

    const bodyReplyLine = getBodyReplyLine({
      createdContent: secureCreatedContent,
      rootContent: secureRootContent,
    });

    const { html, text } = NotificationEmail({
      username: parentContentUser.username,
      bodyReplyLine: bodyReplyLine,
      contentLink: childContendUrl,
    });

    await email.send({
      to: parentContentUser.email,
      from: {
        name: 'TabNews',
        address: 'contato@tabnews.com.br',
      },
      subject: subject,
      html,
      text,
    });
  }
}

function getSubject({ createdContent, rootContent }) {
  const sanitizedRootContentTitle =
    rootContent.title.length > 55 ? `${rootContent.title.substring(0, 55)}...` : rootContent.title;

  return `"${createdContent.owner_username}" comentou em "${sanitizedRootContentTitle}"`;
}

function getBodyReplyLine({ createdContent, rootContent }) {
  if (createdContent.parent_id === rootContent.id) {
    return `"${createdContent.owner_username}" respondeu à sua publicação "${rootContent.title}".`;
  }

  return `"${createdContent.owner_username}" respondeu ao seu comentário na publicação "${rootContent.title}".`;
}

function getChildContendUrl({ owner_username, slug }) {
  return `${webserver.host}/${owner_username}/${slug}`;
}

export default Object.freeze({
  sendReplyEmailToParentUser,
});
