const ABSOLUTE_URL = /^https?:\/\//i;

type CloudinaryResourceType = "image" | "video";

const cleanPath = (value: string) => value.trim().replace(/^\/+/, "");

const cleanPrefix = (value: string) => value.trim().replace(/^\/+|\/+$/g, "");

const encodePublicId = (publicId: string) =>
  publicId
    .split("/")
    .filter(Boolean)
    .map((segment) => encodeURIComponent(segment))
    .join("/");

const cloudinaryCloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME?.trim() ?? "";

const shouldRewriteLocal =
  process.env.NEXT_PUBLIC_CLOUDINARY_REWRITE_LOCAL === "true";

const cloudinaryPublicPrefix = cleanPrefix(
  process.env.NEXT_PUBLIC_CLOUDINARY_PUBLIC_PREFIX ?? "",
);

const stripSourceExtension =
  process.env.NEXT_PUBLIC_CLOUDINARY_STRIP_SOURCE_EXTENSION !== "false";

const cloudinaryImageTransforms =
  process.env.NEXT_PUBLIC_CLOUDINARY_IMAGE_TRANSFORMS?.trim() ||
  "f_auto,q_auto";

const cloudinaryVideoTransforms =
  process.env.NEXT_PUBLIC_CLOUDINARY_VIDEO_TRANSFORMS?.trim() ||
  "f_auto,q_auto";

const cloudinaryDeliveryType =
  process.env.NEXT_PUBLIC_CLOUDINARY_DELIVERY_TYPE?.trim() || "upload";

const getTransforms = (resourceType: CloudinaryResourceType) =>
  resourceType === "video"
    ? cloudinaryVideoTransforms
    : cloudinaryImageTransforms;

const getCloudinaryBase = () =>
  cloudinaryCloudName
    ? `https://res.cloudinary.com/${cloudinaryCloudName}`
    : "";

const withPublicPrefix = (path: string) => {
  if (!cloudinaryPublicPrefix) return path;
  return `${cloudinaryPublicPrefix}/${path}`;
};

const stripFileExtension = (path: string) => {
  const segments = path.split("/").filter(Boolean);
  if (!segments.length) return path;

  const last = segments[segments.length - 1]!;
  const strippedLast = last.replace(/\.[a-z0-9]{2,6}$/i, "");
  segments[segments.length - 1] = strippedLast || last;
  return segments.join("/");
};

const toPublicId = (sourcePath: string) => {
  const cleaned = cleanPath(sourcePath);
  if (!cleaned) return cleaned;
  const normalized = stripSourceExtension
    ? stripFileExtension(cleaned)
    : cleaned;
  return withPublicPrefix(normalized);
};

const buildUploadUrl = (
  sourcePath: string,
  resourceType: CloudinaryResourceType,
) => {
  const base = getCloudinaryBase();
  if (!base) return sourcePath;

  const publicIdSource = toPublicId(sourcePath);
  if (!publicIdSource) return sourcePath;

  const publicId = encodePublicId(publicIdSource);
  const transforms = getTransforms(resourceType);

  return `${base}/${resourceType}/${cloudinaryDeliveryType}/${transforms}/${publicId}`;
};

const buildPublicIdUrl = (
  publicId: string,
  resourceType: CloudinaryResourceType,
) => {
  const base = getCloudinaryBase();
  if (!base) return publicId;

  const publicIdSource = toPublicId(publicId);
  if (!publicIdSource) return publicId;

  const encodedId = encodePublicId(publicIdSource);
  const transforms = getTransforms(resourceType);
  return `${base}/${resourceType}/${cloudinaryDeliveryType}/${transforms}/${encodedId}`;
};

const buildFetchUrl = (
  sourceUrl: string,
  resourceType: CloudinaryResourceType,
) => {
  const base = getCloudinaryBase();
  if (!base) return sourceUrl;

  const transforms = getTransforms(resourceType);
  return `${base}/${resourceType}/fetch/${transforms}/${encodeURIComponent(
    sourceUrl,
  )}`;
};

export function getCloudinaryMediaUrl(
  source: string,
  resourceType: CloudinaryResourceType = "image",
) {
  if (!source || !cloudinaryCloudName) return source;

  if (ABSOLUTE_URL.test(source)) {
    return buildFetchUrl(source, resourceType);
  }

  if (!shouldRewriteLocal) return source;
  return buildUploadUrl(source, resourceType);
}

export const getImageUrl = (source: string) =>
  getCloudinaryMediaUrl(source, "image");

export const getVideoUrl = (source: string) =>
  getCloudinaryMediaUrl(source, "video");

export const getHeroVideoUrl = () =>
  process.env.NEXT_PUBLIC_CLOUDINARY_HERO_VIDEO_PUBLIC_ID?.trim() &&
  cloudinaryCloudName
    ? buildPublicIdUrl(
        process.env.NEXT_PUBLIC_CLOUDINARY_HERO_VIDEO_PUBLIC_ID.trim(),
        "video",
      )
    : getVideoUrl("/video/hero2.mp4");

export const getLogoImageUrl = () =>
  process.env.NEXT_PUBLIC_CLOUDINARY_LOGO_PUBLIC_ID?.trim() &&
  cloudinaryCloudName
    ? buildPublicIdUrl(
        process.env.NEXT_PUBLIC_CLOUDINARY_LOGO_PUBLIC_ID.trim(),
        "image",
      )
    : getImageUrl("/logo/logo.png");

const toUniqueList = (values: string[]) =>
  values.filter((value, index, arr) => value && arr.indexOf(value) === index);

const removeExtension = (value: string) =>
  value.replace(/\.[a-z0-9]{2,6}$/i, "");

export const getHeroVideoSourceUrls = () => {
  const explicitPublicId =
    process.env.NEXT_PUBLIC_CLOUDINARY_HERO_VIDEO_PUBLIC_ID?.trim() || "";

  const cloudinaryCandidates = cloudinaryCloudName
    ? toUniqueList(
        [explicitPublicId, removeExtension(explicitPublicId)]
          .filter(Boolean)
          .map((publicId) => buildPublicIdUrl(publicId, "video")),
      )
    : [];

  const rewrittenLocalCandidates = toUniqueList([
    getVideoUrl("/video/hero2.mp4"),
    getVideoUrl("/video/hero2"),
  ]);

  const hardLocalFallback = ["/video/hero2.mp4"];

  return toUniqueList([
    ...cloudinaryCandidates,
    ...rewrittenLocalCandidates,
    ...hardLocalFallback,
  ]);
};
