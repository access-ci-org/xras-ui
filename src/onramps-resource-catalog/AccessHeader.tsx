import { SquareArrowOutUpRight } from "lucide-react";
import { BTN_SECONDARY, ICON } from "./catalogTheme";

const AccessHeader = ({ baseUrl }: { baseUrl?: string }) => {
  return (
    <>
      {/* The logo used to sit in a flex row, which kept the line box off it. */}
      <div className="flex">
        <img
          alt="Access Logo"
          style={{ height: "75px" }}
          src={`${baseUrl}/access_logo.png`}
        />
      </div>
      <h3 className="border-b">NSF ACCESS Resources</h3>
      <h4>Discover the nationwide NSF cyberinfrastructure</h4>
      <p>
        Need advanced computing and storage options for your research or
        classroom? The ACCESS program has been established and funded by the
        U.S. National Science Foundation to help you - the nation&apos;s researchers
        and educators - to use some of the country&apos;s most advanced computing
        systems and services - at no cost to you.
      </p>
      <p>
        Thousands of researchers, instructors, and students from institutions
        large and small use ACCESS-integrated resources every year. With more
        than 30 resources from more than 15 resource providers, there&apos;s bound to
        be a resource for you, your lab, or your class.
      </p>
      <p>
        Explore the resource catalog below - filter the list to discover the
        resources that have the features or services to accelerate your
        activities. The System Info button will take you to the resource&apos;s
        documentation for all the details.
      </p>
      <p>
        Ready to begin? Click the &quot;Get Your First Project&quot; button and join the
        ACCESS community!
      </p>
      <p>
        <a
          href="https://allocations.access-ci.org/get-your-first-project"
          target="_blank"
          rel="noreferrer"
          className={BTN_SECONDARY}
        >
          Get Your First Project <SquareArrowOutUpRight className={ICON} />
        </a>
      </p>
      <p>
        If you have feedback for ACCESS, please complete our
        <a
          target="_blank"
          rel="noreferrer"
          href="https://docs.google.com/forms/d/e/1FAIpQLSdn-SXokNB_5s0r2SA_S9ZIZWZFlVPRD2OHepTH5HY2YND_zw/viewform"
        >
          {" "}
          Feedback Form
        </a>
        .
        <br />
        If you have questions, please
        <a
          target="_blank"
          rel="noreferrer"
          href="https://support.access-ci.org/user/login?destination=/open-a-ticket"
        >
          {" "}
          open a help ticket
        </a>
        .
      </p>
    </>
  );
};

export default AccessHeader;
