exports.up = async (pgm) => {
  await pgm.createTable('contents', {
    id: {
      type: 'uuid',
      default: pgm.func('gen_random_uuid()'),
      notNull: true,
      primaryKey: true,
      unique: true,
    },

    parent_id: {
      type: 'uuid',
      notNull: false,
    },

    owner_id: {
      type: 'uuid',
      notNull: true,
    },

    slug: {
      type: 'varchar',
      check: 'length(slug) <= 200',
      notNull: true,
    },

    title: {
      type: 'varchar',
      check: 'length(title) <= 256',
      notNull: true,
    },

    body: {
      type: 'text',
      check: 'length(body) <= 20000',
      notNull: true,
    },

    status: {
      type: 'varchar',
      default: 'draft',
      notNull: true,
      check: "status IN ('draft', 'published', 'unpublished', 'deleted')",
    },

    source_url: {
      type: 'varchar',
      check: 'length(body) <= 2000',
      notNull: false,
    },

    created_at: {
      type: 'timestamp with time zone',
      notNull: true,
      default: pgm.func("(now() at time zone 'utc')"),
    },

    updated_at: {
      type: 'timestamp with time zone',
      notNull: true,
      default: pgm.func("(now() at time zone 'utc')"),
    },
  });

  await pgm.addConstraint('contents', 'contents_uniqueness_fkey', 'UNIQUE ("owner_id", "slug")');
};

exports.down = async (pgm) => {
  await pgm.dropConstraint('contents', 'contents_uniqueness_fkey');
  await pgm.dropTable('contents');
};
