const User = require('../models/User');
const Folder = require('../models/Folder');
const Image = require('../models/Image');
const jwt = require('jsonwebtoken');

if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is missing');
}

exports.signup = async (req, res) => {
  try {
    const { email, password } = req.body;
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ error: 'User already exists' });

    const user = new User({ email, password });
    await user.save();
    
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '1d' });
    res.cookie('token', token, { 
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      maxAge: 24 * 60 * 60 * 1000,
      path: '/'
    });
    res.status(201).json({ message: 'User created successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ error: 'Invalid credentials' });

    const isMatch = await user.comparePassword(password);
    if (!isMatch) return res.status(400).json({ error: 'Invalid credentials' });

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '1d' });
    res.cookie('token', token, { 
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      maxAge: 24 * 60 * 60 * 1000,
      path: '/'
    });
    res.json({ message: 'Logged in successfully', user: { id: user._id, email: user.email } });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.logout = (req, res) => {
  res.clearCookie('token', {
    httpOnly: true,
    secure: true,
    sameSite: 'none',
    path: '/'
  });
  res.json({ message: 'Logged out successfully' });
};

exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-password');
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const seedRecruiterDemo = async (userId) => {
  const existingFolders = await Folder.findOne({ userId });
  if (existingFolders) return;

  // Create Folders
  const projectScreenshots = new Folder({ name: 'Project Screenshots', userId, parentId: null });
  await projectScreenshots.save();

  const designAssets = new Folder({ name: 'Design Assets', userId, parentId: null });
  await designAssets.save();

  const analyticsFolder = new Folder({ name: 'Analytics & Reports', userId, parentId: null });
  await analyticsFolder.save();

  // Create Images in Project Screenshots
  const screenshotImages = [
    {
      name: 'Dashboard Mockup.png',
      url: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=800&q=80',
      size: 450120,
      cloudinaryId: 'demo_dashboard_mockup',
      folderId: projectScreenshots._id,
      userId
    },
    {
      name: 'System Architecture.png',
      url: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=800&q=80',
      size: 890430,
      cloudinaryId: 'demo_sys_arch',
      folderId: projectScreenshots._id,
      userId
    }
  ];

  // Create Images in Design Assets
  const designImages = [
    {
      name: 'Product UI Layout.jpg',
      url: 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?auto=format&fit=crop&w=800&q=80',
      size: 612044,
      cloudinaryId: 'demo_ui_layout',
      folderId: designAssets._id,
      userId
    },
    {
      name: 'Developer Workspace.jpg',
      url: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=800&q=80',
      size: 1024332,
      cloudinaryId: 'demo_dev_workspace',
      folderId: designAssets._id,
      userId
    }
  ];

  // Create Images in root (parentId: null)
  const rootImages = [
    {
      name: 'Cloud Infrastructure Diagram.jpg',
      url: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=800&q=80',
      size: 1540300,
      cloudinaryId: 'demo_cloud_diag',
      folderId: null,
      userId
    }
  ];

  await Image.insertMany([...screenshotImages, ...designImages, ...rootImages]);
};

exports.demoLogin = async (req, res) => {
  try {
    const demoEmail = 'recruiter.demo@driveclone.com';
    let user = await User.findOne({ email: demoEmail });
    if (!user) {
      user = new User({ email: demoEmail, password: 'recruiterdemo123_securepassword' });
      await user.save();
    }

    // Seed data
    await seedRecruiterDemo(user._id);

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '1d' });
    res.cookie('token', token, { 
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      maxAge: 24 * 60 * 60 * 1000,
      path: '/'
    });
    res.json({ message: 'Logged in successfully', user: { id: user._id, email: user.email } });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

